import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { guessGender } from "../data/nouns";
import { translateFrEn } from "../lib/translate";
import { useFavorites } from "../lib/favorites";
import { speak } from "../lib/speech";
import { Icon, Seg } from "../components/ui";

type Mode = "gender" | "conj" | "translate";
const RECENT_KEY = "recent-gender";

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function Reference() {
  const [mode, setMode] = useState<Mode>("gender");
  const [q, setQ] = useState("");
  const [word, setWord] = useState("");
  const [en, setEn] = useState("");
  const [recent, setRecent] = useState<string[]>(loadRecent);
  const { favs } = useFavorites("verb");
  const nav = useNavigate();

  const result = word ? guessGender(word) : null;

  useEffect(() => {
    if (!word || !result) return;
    if (result.en) return setEn(result.en);
    setEn("");
    translateFrEn(word).then(setEn).catch(() => {});
  }, [word]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const w = q.trim().toLowerCase();
    if (!w) return;
    if (mode === "conj") return nav(`/reference/verb/${encodeURIComponent(w)}`);
    if (mode === "translate") return nav(`/reference/translate?q=${encodeURIComponent(q.trim())}`);
    const clean = w.replace(/^(le|la|l'|l’|un|une)\s*/, "");
    setWord(clean);
    const g = guessGender(clean);
    if (g) {
      const next = [`${g.g === "m" ? (/^[aeiouyhéèêâîôû]/.test(clean) ? "l’" : "le ") : /^[aeiouyhéèêâîôû]/.test(clean) ? "l’" : "la "}${clean}|${clean}`, ...recent.filter((r) => !r.endsWith("|" + clean))].slice(0, 8);
      setRecent(next);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* storage may be unavailable */
      }
    }
  };

  const placeholder = mode === "gender" ? "A noun, e.g. problème" : mode === "conj" ? "A verb, e.g. faire" : "A French word or phrase";
  const article = result ? (/^[aeiouyhéèêâîôû]/.test(word) ? "l’" : result.g === "m" ? "le " : "la ") : "";

  return (
    <div className="screen">
      <h1>Reference</h1>
      <form className="card row" style={{ padding: "12px 14px", gap: 10, flexDirection: "row" }} onSubmit={submit}>
        <Icon name="search" size={20} color="#6B5850" />
        <input className="grow" style={{ border: 0, outline: 0, background: "none", fontSize: 14 }} placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" autoCapitalize="off" />
        <button className="chip" type="submit">Go</button>
      </form>
      <Seg items={[{ id: "gender", label: "Gender" }, { id: "conj", label: "Conjugation" }, { id: "translate", label: "Translate" }]} value={mode} onChange={(m) => { setMode(m); setWord(""); }} />

      {mode === "gender" && word && (
        result ? (
          <div className="card" style={{ padding: 20 }}>
            <div className="row between">
              <h1 style={{ fontSize: 24 }}>{article}{word}</h1>
              <span className="chip red">{result.g === "m" ? "masculine" : "feminine"}{result.sure ? "" : " · likely"}</span>
            </div>
            <div className="row">
              <span className="small muted grow">{en || "…"}</span>
              <button className="icon-btn" onClick={() => speak(article + word)} aria-label="Listen"><Icon name="speaker" size={18} color="#B9592D" /></button>
            </div>
            <div className="card tint" style={{ padding: 12, gap: 4 }}>
              <b className="small" style={{ color: "#5B4034" }}>Why {result.g === "m" ? "masculine" : "feminine"}?</b>
              <p className="small" style={{ color: "#5B4034" }}>{result.why}</p>
              {!result.sure && <p className="xs" style={{ color: "#5B4034" }}>This word isn’t in our list yet, so this is a guess from its ending. Check a dictionary to be sure.</p>}
            </div>
          </div>
        ) : (
          <div className="card"><p className="small">We couldn’t guess the gender of “{word}”. Check a dictionary such as Wiktionary.</p></div>
        )
      )}

      {mode === "gender" && recent.length > 0 && (
        <>
          <span className="label">Recently checked</span>
          <div className="row wrap" style={{ gap: 6 }}>
            {recent.map((r) => { const [label, w] = r.split("|"); return <button key={r} className="chip" onClick={() => { setQ(w); setWord(w); }}>{label}</button>; })}
          </div>
        </>
      )}

      {mode === "conj" && favs.size > 0 && (
        <>
          <span className="label">Favorite verbs</span>
          <div className="row wrap" style={{ gap: 6 }}>
            {Array.from(favs).map((v) => <Link key={v} className="chip" to={`/reference/verb/${encodeURIComponent(v)}`}>{v}</Link>)}
          </div>
        </>
      )}

      <div className="card flat">
        <Link className="list-row" to="/reference/irregular" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="grow"><div className="t">Irregular verbs</div><div className="s">The ones everyone talks about</div></div>
          <Icon name="chev" size={18} color="#6B5850" />
        </Link>
        <Link className="list-row" to="/reference/translate" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="grow"><div className="t">Translate a phrase</div><div className="s">French to English</div></div>
          <Icon name="chev" size={18} color="#6B5850" />
        </Link>
      </div>
      {mode === "conj" && !q && <p className="xs muted">Try “prendre”, “se lever” or “appeler”. Works for regular verbs and about 60 common irregular ones.</p>}
    </div>
  );
}

