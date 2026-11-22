import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { translateLong, translateFrEn } from "../lib/translate";
import { speechSupported, startRecognition, type Recorder } from "../lib/speech";
import { saveWords } from "../lib/supabase";
import { guessGender } from "../data/nouns";
import { tokenize, FR_STOP } from "../lib/score";
import { Header, Icon, Spinner } from "../components/ui";

export default function Translate() {
  const [params] = useSearchParams();
  const [src, setSrc] = useState(params.get("q") ?? "");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [listening, setListening] = useState(false);
  const [words, setWords] = useState<{ fr: string; en: string; g?: string }[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const rec = useRef<Recorder | null>(null);

  const run = async (text = src) => {
    if (!text.trim()) return;
    setErr("");
    setBusy(true);
    setWords([]);
    try {
      setOut(await translateLong(text));
      const uniq = Array.from(new Set(tokenize(text).filter((w) => w.length > 2 && !FR_STOP.has(w)))).slice(0, 5);
      const ws = await Promise.all(
        uniq.map(async (w) => {
          const g = guessGender(w);
          return { fr: w, en: g?.sure && g.en ? g.en : await translateFrEn(w).catch(() => ""), g: g?.sure ? (g.g === "m" ? "masculine" : "feminine") : undefined };
        }),
      );
      setWords(ws.filter((w) => w.en && w.en.toLowerCase() !== w.fr));
    } catch (e: any) {
      setErr(e.message || "Translation failed.");
    }
    setBusy(false);
  };

  useEffect(() => {
    if (params.get("q")) run(params.get("q")!);
  }, []);

  const mic = () => {
    if (listening) {
      rec.current?.stop();
      setListening(false);
      return;
    }
    setListening(true);
    rec.current = startRecognition("fr-FR", (f, i) => setSrc((f + " " + i).trim()));
  };

  return (
    <div className="screen">
      <Header title="Translate" />
      <div className="card">
        <div className="row between">
          <span className="label">French</span>
          {speechSupported() && <button className="icon-btn" onClick={mic} aria-label="Dictate"><Icon name="mic" size={20} color={listening ? "#A4161A" : "#6B5850"} /></button>}
        </div>
        <textarea className="input" style={{ border: 0, padding: 0, minHeight: 80, fontSize: 18, fontWeight: 500 }} placeholder="Il était une fois…" value={src} onChange={(e) => setSrc(e.target.value)} />
        <button className="btn primary sm" style={{ alignSelf: "flex-end" }} onClick={() => run()} disabled={busy}>Translate</button>
      </div>
      {busy && <div className="row"><Spinner /><span className="small muted">Translating…</span></div>}
      {out && (
        <div className="card tint">
          <div className="row between">
            <span className="label" style={{ color: "#5B4034" }}>English</span>
          </div>
          <p style={{ fontSize: 18, fontWeight: 500, color: "#5B4034" }}>{out}</p>
        </div>
      )}
      {words.length > 0 && (
        <>
          <span className="label">Words from this phrase</span>
          <div className="card flat">
            {words.map((w) => (
              <div className="list-row" key={w.fr} style={{ cursor: "default" }}>
                <div className="grow"><div className="t">{w.fr}</div><div className="s">{w.en}{w.g ? ` · ${w.g}` : ""}</div></div>
                <button className="icon-btn" aria-label="Add to My words" onClick={async () => { await saveWords([{ word: w.fr, translation: w.en, reason: "meaning" }]); setSaved(new Set(saved).add(w.fr)); }}>
                  <Icon name={saved.has(w.fr) ? "check" : "plus"} size={18} color="#6B5850" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      {err && <p className="err">{err}</p>}
      <p className="xs muted">Machine translation by MyMemory. Only the text you translate is sent.</p>
    </div>
  );
}
