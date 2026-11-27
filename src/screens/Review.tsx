import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase, type WordRow } from "../lib/supabase";
import { speechSupported, startRecognition, type Recorder } from "../lib/speech";
import { similar, tokenize } from "../lib/score";
import { Header, Icon, Pron, Spinner, Wave, useMeaning } from "../components/ui";

export default function Review() {
  const { mode } = useParams(); // "read" | "translate"
  const nav = useNavigate();
  const [queue, setQueue] = useState<WordRow[] | null>(null);
  const [i, setI] = useState(0);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [micErr, setMicErr] = useState("");
  const [result, setResult] = useState<null | boolean>(null);
  const [typed, setTyped] = useState("");
  const [score, setScore] = useState(0);
  const rec = useRef<Recorder | null>(null);

  useEffect(() => {
    supabase.from("words").select("*").eq("learned", false).order("correct_streak").limit(15).then(({ data }) => setQueue((data ?? []).sort(() => Math.random() - 0.5)));
    return () => {
      rec.current?.stop();
    };
  }, []);

  const meaning = useMeaning(queue?.[i]?.word, queue?.[i]?.translation ?? "");

  if (!queue) return <div className="screen" style={{ alignItems: "center", paddingTop: 80 }}><Spinner /></div>;
  const w = queue[i];

  const check = async (said: string) => {
    if (!w) return;
    let ok: boolean;
    if (mode === "read") ok = tokenize(said).some((t) => similar(t, tokenize(w.word)[0] ?? w.word, 0.8)) || similar(said.toLowerCase(), w.word.toLowerCase(), 0.8);
    else {
      const ref = tokenize(meaning + " " + w.translation);
      ok = ref.length > 0 && tokenize(said).some((t) => ref.some((r) => r.length > 2 && similar(t, r, 0.75)));
    }
    setResult(ok);
    if (ok) setScore((s) => s + 1);
    const streak = ok ? w.correct_streak + 1 : 0;
    await supabase.from("words").update({ reviews: w.reviews + 1, correct_streak: streak, learned: streak >= 3 }).eq("id", w.id);
  };

  const finish = async () => {
    setListening(false);
    const said = (await rec.current?.stop()) ?? heard;
    rec.current = null;
    setHeard(said);
    if (!said.trim()) return setMicErr("We didn’t hear anything. Tap the microphone and try again.");
    check(said);
  };

  const mic = async () => {
    if (rec.current) return finish();
    setHeard("");
    setMicErr("");
    setListening(true);
    rec.current = startRecognition(
      mode === "read" ? "fr-FR" : "en-US",
      (f, it) => setHeard((f + " " + it).trim()),
      (msg) => {
        setMicErr(msg);
        setListening(false);
        rec.current = null;
      },
      () => finish(),
    );
  };

  const next = () => {
    setResult(null);
    setHeard("");
    setMicErr("");
    setTyped("");
    setI(i + 1);
  };

  if (!w)
    return (
      <div className="screen">
        <Header title="Review" onBack={() => nav("/words")} />
        <div className="card center" style={{ padding: 30, alignItems: "center" }}>
          <h1>{queue.length ? "Bien joué !" : "Nothing to review"}</h1>
          {queue.length > 0 && <p className="muted">{score} of {queue.length} correct. A word counts as learned after 3 correct answers in a row.</p>}
        </div>
        <button className="btn primary" onClick={() => nav("/words")}>Back to My words</button>
      </div>
    );

  return (
    <div className="screen focus">
      <Header title={mode === "read" ? "Read aloud" : "Translate"} onBack={() => nav("/words")} />
      <span className="xs muted">{i + 1} of {queue.length}</span>
      <div className="card center" style={{ padding: "36px 20px", alignItems: "center", gap: 12 }}>
        <p style={{ fontSize: 30, fontWeight: 700 }}>{w.word}</p>
        <Pron word={w.word} size={19} />
        {(mode === "read" || result !== null) && <p className="muted">{meaning}</p>}
      </div>
      {heard && <p className="small muted center" style={{ fontStyle: "italic" }}>“{heard}”</p>}
      {micErr && <p className="err center">{micErr}</p>}
      {result !== null ? (
        <>
          <div className="card tint row" style={{ flexDirection: "row" }}>
            <Icon name={result ? "check" : "x"} size={18} color="#5B4034" />
            <b style={{ color: "#5B4034" }}>{result ? "Correct" : mode === "read" ? "Not quite. Check the pronunciation above and try again next time." : `It means: ${meaning}`}</b>
          </div>
          <button className="btn primary" onClick={next}>Next</button>
        </>
      ) : !speechSupported() ? (
        <div className="stack">
          <input className="input" placeholder={mode === "read" ? "Type the word" : "Type the English meaning"} value={typed} onChange={(e) => setTyped(e.target.value)} />
          <button className="btn primary" onClick={() => check(typed)}>Check</button>
        </div>
      ) : (
        <div className="micdock">
          {listening && <Wave />}
          <button className={"mic" + (listening ? " rec" : "")} onClick={mic} aria-label={listening ? "Stop" : "Speak"}>
            {listening ? <span style={{ width: 26, height: 26, borderRadius: 6, background: "#FFF3E6" }} /> : <Icon name="mic" size={34} color="#FFF3E6" />}
          </button>
          <span className="small muted">{mode === "read" ? "Say the word in French" : "Say what it means in English"}</span>
        </div>
      )}
    </div>
  );
}
