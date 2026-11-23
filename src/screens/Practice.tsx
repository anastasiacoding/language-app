import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { RULE_MAP } from "../data/rules";
import { nextItem, loadWords, type Item } from "../lib/practice";
import { recordActivity, GRAMMAR_MIN } from "../lib/activity";
import { speechSupported, startRecognition, type Recorder } from "../lib/speech";
import { similar, normalize } from "../lib/score";
import { Header, Icon } from "../components/ui";

export default function Practice() {
  const { id } = useParams();
  const rule = RULE_MAP.get(id!);
  const [item, setItem] = useState<Item>(() => nextItem(id!));
  const [chosen, setChosen] = useState<string | null>(null);
  const [count, setCount] = useState(1);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const rec = useRef<Recorder | null>(null);

  useEffect(() => {
    // switch to the large word list as soon as it's loaded
    loadWords().then(() => setItem((cur) => (chosen ? cur : nextItem(id!))));
  }, [id]);

  const answered = useRef(0);
  const choose = (o: string) => {
    if (chosen) return;
    setChosen(o);
    answered.current++;
    if (answered.current === GRAMMAR_MIN) recordActivity("grammar");
  };

  const next = () => {
    setItem(nextItem(id!, item));
    setChosen(null);
    setHeard("");
    setCount((c) => c + 1);
  };

  const voice = () => {
    if (listening) {
      rec.current?.stop();
      setListening(false);
      return;
    }
    setHeard("");
    setListening(true);
    rec.current = startRecognition("fr-FR", (f, i) => {
      const said = normalize((f + " " + i).trim());
      setHeard(said);
      // pick the option whose words appear in what was said
      const match = item.options
        .map((o) => ({ o, n: normalize(o).replace(/’/g, "'") }))
        .sort((a, b) => b.n.length - a.n.length)
        .find(({ n }) => said.replace(/’/g, "'").split(/\s+/).some((w) => similar(w, n.replace(/'$/, ""), 0.85)) || said.includes(n));
      if (match && f) {
        rec.current?.stop();
        setListening(false);
        choose(match.o);
      }
    });
  };

  if (!rule) return <div className="screen"><Header title="Practice" /></div>;
  const ok = chosen === item.answer;
  return (
    <div className="screen">
      <Header title="Practice" />
      <div className="row wrap" style={{ gap: 6 }}>
        <span className="chip">{rule.title}</span>
        <span className="xs muted">example {count} · no score, practice as long as you like</span>
      </div>
      <div className="card" style={{ padding: 22 }}>
        <p style={{ fontSize: item.before || item.after.length > 20 ? 22 : 30, fontWeight: 600, lineHeight: 1.4, textAlign: item.before || item.after.length > 20 ? "left" : "center" }}>
          {item.before}
          <span style={{ color: chosen ? (ok ? "var(--green)" : "var(--scarlet)") : "var(--scarlet)", borderBottom: chosen ? "none" : "2px solid var(--scarlet)", padding: "0 4px" }}>{chosen ? item.answer : "\u00A0\u00A0\u00A0\u00A0"}</span>
          {item.after}
        </p>
        {item.en && <p className="small muted">{item.en}</p>}
      </div>
      <div className="opts" style={item.options.length === 3 ? { gridTemplateColumns: "1fr 1fr 1fr" } : undefined}>
        {item.options.map((o) => (
          <button key={o} className={"opt" + (chosen ? (o === item.answer ? " right" : o === chosen ? " wrong" : "") : "")} onClick={() => choose(o)}>{o}</button>
        ))}
      </div>
      {chosen && (
        <div className={"card feedback " + (ok ? "ok" : "bad")} style={{ gap: 4, borderColor: "transparent" }}>
          <div className="row" style={{ gap: 8 }}>
            <Icon name={ok ? "check" : "x"} size={18} color={ok ? "#4E7D3A" : "#A4161A"} />
            <b>{ok ? `Correct: ${item.answer}` : `It’s ${item.answer}`}</b>
          </div>
          <p className="small" style={{ color: "var(--text)" }}>{item.explain}</p>
        </div>
      )}
      {heard && !chosen && <p className="small muted" style={{ fontStyle: "italic" }}>“{heard}”</p>}
      <div className="row" style={{ gap: 10 }}>
        {speechSupported() && !chosen && (
          <button className="btn" onClick={voice}><Icon name="mic" size={18} /> {listening ? "Listening…" : "By voice"}</button>
        )}
        {chosen && <button className="btn primary" onClick={next}>Next</button>}
      </div>
    </div>
  );
}
