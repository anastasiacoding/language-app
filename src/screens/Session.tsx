import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase, latestConsents, setConsent, saveWords, type TextRow } from "../lib/supabase";
import { speechSupported, startRecognition, type Recorder } from "../lib/speech";
import { scoreReading, scoreRetelling, scoreTranslation, splitPassages, tokenize, retellKeywords, type RetellResult } from "../lib/score";
import { checkGrammar } from "../lib/books";
import { translateFrEn, translateLong } from "../lib/translate";
import { gloss, tidyMeaning } from "../lib/ipa";
import { recordActivity } from "../lib/activity";
import { Header, Icon, Pron, Spinner, Steps, Wave } from "../components/ui";

type Step = "read" | "translate" | "retell" | "results";

function MicDock({ recording, onToggle, hint, onRestart }: { recording: boolean; onToggle: () => void; hint: string; onRestart?: () => void }) {
  return (
    <div className="micdock">
      {recording && <Wave />}
      {recording && onRestart && (
        <button className="btn ghost" style={{ height: 34, fontSize: 14, padding: "0 12px" }} onClick={onRestart}>
          <Icon name="refresh" size={16} /> Start over
        </button>
      )}
      <button className={"mic" + (recording ? " rec" : "")} onClick={onToggle} aria-label={recording ? "Stop recording" : "Start recording"}>
        {recording ? <span style={{ width: 26, height: 26, borderRadius: 6, background: "#FFF3E6" }} /> : <Icon name="mic" size={34} color="#FFF3E6" />}
      </button>
      <span className="small muted center">{hint}</span>
    </div>
  );
}

export default function Session() {
  const { id } = useParams();
  const nav = useNavigate();
  const [text, setText] = useState<TextRow | null>(null);
  const [voiceOk, setVoiceOk] = useState<boolean | null>(null);
  const [step, setStep] = useState<Step>("read");
  const [recording, setRecording] = useState(false);
  const [heard, setHeard] = useState("");
  const [interim, setInterim] = useState("");
  const [err, setErr] = useState("");
  const [typed, setTyped] = useState("");
  const [typing, setTyping] = useState(false);
  const recRef = useRef<Recorder | null>(null);
  const startedAt = useRef(Date.now());
  const recStart = useRef(0);
  const [elapsed, setElapsed] = useState(0);

  // results per step
  const [reading, setReading] = useState<{ score: number; bad: Set<number> } | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [pickRect, setPickRect] = useState<{ x: number; top: number; bottom: number } | null>(null);
  // the popup is placed on the screen, so close it when anything scrolls
  useEffect(() => {
    if (picked === null) return;
    const close = () => setPicked(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [picked]);
  const [translation, setTranslation] = useState<{ score: number; reference: string; missed: string[]; said: string } | null>(null);
  const [retell, setRetell] = useState<(RetellResult & { said: string }) | null>(null);
  const [unknown, setUnknown] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [practiceWords, setPracticeWords] = useState<{ word: string; translation: string; reason: "pronunciation" | "meaning" }[]>([]);

  const supported = speechSupported();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("texts").select("*").eq("id", id).maybeSingle();
      setText(data);
      const c = await latestConsents();
      setVoiceOk(!!c.voice);
    })();
    return () => {
      recRef.current?.stop();
    };
  }, [id]);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setElapsed(Math.round((Date.now() - recStart.current) / 1000)), 500);
    return () => clearInterval(t);
  }, [recording]);

  const passages = useMemo(() => (text ? splitPassages(text.content) : []), [text]);
  const pIndex = text && passages.length ? text.passage_index % passages.length : 0;
  const passage = passages[pIndex] ?? "";
  const chunks = useMemo(() => passage.split(/\s+/).filter(Boolean), [passage]);
  const chunkTokens = useMemo(() => chunks.map((c) => tokenize(c).length), [chunks]);
  const suggested = useMemo(() => retellKeywords(passage), [passage]);

  const resetCapture = () => {
    setHeard("");
    setInterim("");
    setTyped("");
    setErr("");
    setElapsed(0);
  };

  const finishing = useRef(false);
  const stopAndFinish = async (onDone: (said: string) => void) => {
    if (finishing.current) return;
    finishing.current = true;
    setRecording(false);
    const said = (await recRef.current?.stop()) ?? "";
    recRef.current = null;
    setInterim("");
    setHeard(said);
    finishing.current = false;
    if (!said.trim()) {
      setErr("We didn’t hear anything. Tap the microphone and speak a little closer to the phone.");
      return;
    }
    onDone(said);
  };

  const startRec = (lang: string, onDone: (said: string) => void, autoDone?: (said: string) => boolean) => {
    resetCapture();
    recStart.current = Date.now();
    setRecording(true);
    recRef.current = startRecognition(
      lang,
      (f, i) => {
        setHeard(f);
        setInterim(i);
        if (autoDone && autoDone((f + " " + i).trim())) stopAndFinish(onDone);
      },
      (msg) => {
        setErr(msg);
        setRecording(false);
        setInterim("");
        recRef.current = null;
        finishing.current = false;
      },
      // the browser stopped by itself (long pause, iPhone limits): score what was heard
      () => stopAndFinish(onDone),
    );
  };

  const toggle = (lang: string, onDone: (said: string) => void, autoDone?: (said: string) => boolean) => {
    if (busy) return;
    if (recRef.current) {
      stopAndFinish(onDone);
      return;
    }
    startRec(lang, onDone, autoDone);
  };

  /** Throws away what was said so far and listens again. */
  const restart = (lang: string, onDone: (said: string) => void, autoDone?: (said: string) => boolean) => {
    recRef.current?.abort();
    recRef.current = null;
    finishing.current = false;
    startRec(lang, onDone, autoDone);
  };

  /** Stops on its own once the last words of the passage have been read. */
  const readToEnd = (said: string) => {
    const r = scoreReading(passage, said);
    const n = r.words.length;
    return n > 3 && r.words[n - 1].ok && r.words[n - 2].ok && r.score >= 40;
  };

  const finishReading = (said: string) => {
    if (!said) return setErr("We didn’t hear anything. Tap the microphone and read the passage aloud.");
    const r = scoreReading(passage, said);
    const bad = new Set<number>();
    let k = 0;
    chunks.forEach((_, ci) => {
      for (let n = 0; n < chunkTokens[ci]; n++, k++) if (!r.words[k]?.ok) bad.add(ci);
    });
    setReading({ score: r.score, bad });
  };

  const finishTranslation = async (said: string) => {
    if (!said.trim()) return setErr("Say or type your translation first.");
    setBusy(true);
    try {
      const reference = await translateLong(passage);
      const r = scoreTranslation(reference, said);
      setTranslation({ score: r.score, reference, missed: r.missed, said });
      if (reading) recordActivity("text"); // reading + translation is enough for the streak
    } catch (e: any) {
      setErr(e.message || "Couldn’t check the translation right now.");
    }
    setBusy(false);
  };

  const finishRetell = async (said: string) => {
    if (!said.trim()) return setErr("Say or type your retelling first.");
    setBusy(true);
    const issues = await checkGrammar(said).catch(() => null);
    setBusy(false);
    setRetell({ ...scoreRetelling(passage, said, suggested, issues), said });
  };

  const cleanWord = (w: string) => w.replace(/^[«"“(\[—–-]+|[»"”)\].,;:!?…]+$/g, "").replace(/^(l|d|j|m|t|s|n|qu|c)['’]/i, "");

  const saveAll = async () => {
    setBusy(true);
    const pron = Array.from(reading?.bad ?? []).map((i) => cleanWord(chunks[i])).filter((w) => w.length > 2);
    const mean = Array.from(unknown).map((i) => cleanWord(chunks[i])).filter((w) => w.length > 1);
    const uniq = (a: string[]) => Array.from(new Set(a.map((w) => w.toLowerCase())));
    const list = [
      ...uniq(mean).map((w) => ({ word: w, reason: "meaning" as const })),
      ...uniq(pron).filter((w) => !mean.map((m) => m.toLowerCase()).includes(w)).map((w) => ({ word: w, reason: "pronunciation" as const })),
    ].slice(0, 12);
    const withT = await Promise.all(list.map(async (w) => ({ ...w, translation: (await gloss(w.word)) ?? tidyMeaning(await translateFrEn(w.word).catch(() => "")) })));
    setPracticeWords(withT);
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("sessions").insert({
      user_id: u.user!.id,
      text_id: text!.id,
      reading: reading?.score ?? null,
      translation: translation?.score ?? null,
      retelling: retell?.score ?? null,
      duration_sec: Math.min(7200, Math.round((Date.now() - startedAt.current) / 1000)),
    });
    await saveWords(withT.map((w) => ({ ...w, text_id: text!.id })));
    if (reading && translation) await recordActivity("text");
    await supabase.from("texts").update({ passage_index: text!.passage_index + 1 }).eq("id", text!.id);
    setBusy(false);
    setStep("results");
  };

  const nextPassage = () => {
    setText({ ...text!, passage_index: text!.passage_index + 1 });
    setReading(null);
    setTranslation(null);
    setRetell(null);
    setUnknown(new Set());
    setPracticeWords([]);
    resetCapture();
    startedAt.current = Date.now();
    setStep("read");
  };

  if (!text || voiceOk === null)
    return (
      <div className="screen" style={{ alignItems: "center", paddingTop: 80 }}>
        {text === null && voiceOk !== null ? <p className="muted">Text not found.</p> : <Spinner />}
      </div>
    );

  if (!voiceOk)
    return (
      <div className="screen">
        <Header title={text.title} />
        <div className="card stack">
          <h3>Voice scoring is off</h3>
          <p className="small">To score your reading, translation and retelling, the app turns your speech into text with your device’s speech recognition. Recordings are never stored.</p>
          <button className="btn primary" onClick={async () => { await setConsent("voice", true); setVoiceOk(true); }}>Turn on voice scoring</button>
          <Link to="/privacy" className="btn ghost">Read the Privacy Policy</Link>
        </div>
      </div>
    );

  const live = (heard + " " + interim).trim();
  const timer = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
  const typeInstead = (onSubmit: (s: string) => void, placeholder: string) =>
    typing || !supported ? (
      <div className="stack">
        <textarea className="input" style={{ minHeight: 100 }} placeholder={placeholder} value={typed} onChange={(e) => setTyped(e.target.value)} />
        <button className="btn primary" disabled={busy} onClick={() => onSubmit(typed)}>{busy ? "Checking…" : "Check"}</button>
        {supported && <button className="btn ghost" onClick={() => { setTyping(false); setTyped(""); setErr(""); }}><Icon name="mic" size={18} /> Use voice instead</button>}
      </div>
    ) : (
      <button className="btn ghost" disabled={recording} onClick={() => { setTyping(true); setErr(""); }}>Type instead</button>
    );

  return (
    <div className={"screen" + (step !== "results" ? " focus" : "")}>
      {step !== "results" && (
        <>
          <Header title={text.title} onBack={() => nav("/")} />
          <div className="row between">
            <Steps current={step === "read" ? 1 : step === "translate" ? 2 : 3} />
          </div>
          <span className="xs muted">Passage {pIndex + 1} of {passages.length}</span>
        </>
      )}

      {!supported && step !== "results" && (
        <div className="notice">Speech recognition isn’t available in this browser. Open the app in Safari on iPhone or Chrome on Android to practice out loud.</div>
      )}

      {step === "read" && (
        <>
          <div className="card reading" style={{ maxHeight: reading ? "none" : "calc(100vh - 380px)", overflowY: "auto" }}>
            <p>
              {chunks.map((c, i) => (
                <span key={i}>
                  <span
                    className={"w " + (reading ? (reading.bad.has(i) ? "bad" : "good") : "") + (picked === i ? " picked" : "")}
                    onClick={reading ? (e) => { const r = e.currentTarget.getBoundingClientRect(); setPickRect({ x: r.left + r.width / 2, top: r.top, bottom: r.bottom }); setPicked(picked === i ? null : i); } : undefined}
                  >{c}</span>{" "}
                </span>
              ))}
            </p>
          </div>
          {reading && picked !== null && pickRect && (
            <div className="pron-pop" style={{ left: Math.min(Math.max(pickRect.x, 80), window.innerWidth - 80), ...(pickRect.top > 90 ? { top: pickRect.top - 8, transform: "translate(-50%, -100%)" } : { top: pickRect.bottom + 8, transform: "translate(-50%, 0)" }) }} onClick={() => setPicked(null)}>
              <b>{chunks[picked].replace(/^[«"“(\[—–-]+|[»"”)\].,;:!?…]+$/g, "")}</b>
              <Pron word={chunks[picked]} size={17} />
            </div>
          )}
          {reading ? (
            <>
              <div className="card tint row between">
                <div><b style={{ fontSize: 22 }}>{reading.score}%</b> <span className="small muted">reading accuracy</span></div>
                <span className="row xs muted" style={{ gap: 6 }}><span style={{ width: 16, height: 2, background: "var(--scarlet)" }} />to practice</span>
              </div>
              {picked === null && <p className="xs muted center">Tap a word to see how it’s pronounced.</p>}
              <div className="row" style={{ gap: 10 }}>
                <button className="btn" onClick={() => { setReading(null); setPicked(null); resetCapture(); }}><Icon name="refresh" size={18} /> Again</button>
                <button className="btn primary" onClick={() => { resetCapture(); setTyping(false); setStep("translate"); }}>Next</button>
              </div>
            </>
          ) : (
            <>
              {live && <p className="small muted" style={{ fontStyle: "italic" }}>“{live}”</p>}

              {!supported && <button className="btn" onClick={() => setStep("translate")}>Skip to translation</button>}
            </>
          )}
          {err && <p className="err">{err}</p>}
          {!reading && supported && <MicDock recording={recording} onRestart={() => restart("fr-FR", finishReading, readToEnd)} onToggle={() => toggle("fr-FR", finishReading, readToEnd)} hint={recording ? `${timer} · stops by itself at the end, or tap` : "Tap and read the passage aloud"} />}
        </>
      )}

      {step === "translate" && (
        <>
          <div className="card" style={{ maxHeight: translation ? "none" : "calc(100vh - 380px)", overflowY: "auto" }}>
            <span className="label">Original · tap words you didn’t know</span>
            <p className="reading" style={{ fontSize: 17 }}>
              {chunks.map((c, i) => (
                <span key={i}>
                  <span className={"w" + (unknown.has(i) ? " picked" : "")} onClick={() => { const s = new Set(unknown); s.has(i) ? s.delete(i) : s.add(i); setUnknown(s); }}>{c}</span>{" "}
                </span>
              ))}
            </p>
          </div>
          {translation ? (
            <>
              <div className="card soft">
                <div className="row between"><span className="label">Your translation</span><span className="chip">{translation.score}%</span></div>
                <p>{translation.said}</p>
              </div>
              <div className="card tint">
                <span className="label" style={{ color: "#5B4034" }}>Reference translation</span>
                <p style={{ color: "#5B4034" }}>{translation.reference}</p>
                {translation.missed.length > 0 && <p className="xs" style={{ color: "#5B4034" }}>Words you might have missed: {translation.missed.slice(0, 8).join(", ")}</p>}
              </div>
              <p className="xs muted">The score compares meaning word by word, so it’s approximate. Machine translation by MyMemory.</p>
              <div className="row" style={{ gap: 10 }}>
                <button className="btn" onClick={() => { setTranslation(null); resetCapture(); setTyping(false); }}><Icon name="refresh" size={18} /> Again</button>
                <button className="btn primary" onClick={() => { resetCapture(); setTyping(false); setStep("retell"); }}>Next</button>
              </div>
              <button className="btn ghost" onClick={() => { const said = translation.said; setTranslation(null); resetCapture(); setTyped(said); setTyping(true); }}><Icon name="pen" size={18} /> Edit as text</button>
            </>
          ) : (
            <>
              {live && <div className="card soft"><span className="label">You’re saying</span><p>{live}</p></div>}
              {busy && <div className="row"><Spinner /><span className="small muted">Checking your translation…</span></div>}
              {typeInstead(finishTranslation, "Your English translation")}
            </>
          )}
          {err && <p className="err">{err}</p>}
          {!translation && supported && !typing && <MicDock recording={recording} onRestart={() => restart("en-US", finishTranslation)} onToggle={() => toggle("en-US", finishTranslation)} hint={recording ? `${timer} · tap to finish` : "Say your translation in English"} />}
        </>
      )}

      {step === "retell" && (
        <>
          <div className="card">
            <h2>Retell the passage</h2>
            <p className="small muted">In your own words, in French. Use all the words below: they count toward your score, together with meaning and grammar.</p>
            <span className="label">Use these words</span>
            <div className="row wrap" style={{ gap: 6 }}>
              {suggested.map((k) => {
                const st = retell ? (retell.keywordsUsed.includes(k) ? "ok" : "bad") : "";
                return <span key={k} className="chip" style={st ? { background: st === "ok" ? "var(--green-soft)" : "var(--scarlet-soft)", color: st === "ok" ? "var(--green)" : "var(--scarlet)" } : undefined}>{st === "ok" ? "✓ " : ""}{k}</span>;
              })}
            </div>
          </div>
          {retell ? (
            <>
              <div className="card soft">
                <div className="row between"><span className="label">Your retelling</span><span className="chip">{retell.score}%</span></div>
                <p style={{ fontStyle: "italic" }}>{retell.said}</p>
              </div>
              <div className="card" style={{ gap: 8 }}>
                <div className="row between small"><span>Suggested words</span><b>{retell.keywordsUsed.length} of {suggested.length}</b></div>
                <div className="row between small"><span>Meaning, close to the original</span><b>{retell.meaning}%</b></div>
                <div className="row between small"><span>Grammar</span><b>{retell.grammar == null ? "couldn’t check" : retell.issues.length ? `${retell.issues.length} to fix` : "no issues found"}</b></div>
                {retell.issues.length > 0 && (
                  <div className="stack" style={{ gap: 6, borderTop: "1px solid var(--line)", paddingTop: 8 }}>
                    {retell.issues.map((g, i) => (
                      <div key={i} className="small">
                        <span style={{ color: "var(--scarlet)", textDecoration: "line-through" }}>{g.text}</span>
                        {g.fix[0] && <> → <b style={{ color: "var(--green)" }}>{g.fix[0]}</b></>}
                        <div className="xs muted">{g.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="xs muted">Grammar is checked by LanguageTool. Meaning is compared by shared words, so it’s approximate.</p>
              <div className="row" style={{ gap: 10 }}>
                <button className="btn" onClick={() => { setRetell(null); resetCapture(); setTyping(false); }}><Icon name="refresh" size={18} /> Again</button>
                <button className="btn primary" disabled={busy} onClick={saveAll}>{busy ? "Saving…" : "See results"}</button>
              </div>
              <button className="btn ghost" onClick={() => { const said = retell.said; setRetell(null); resetCapture(); setTyped(said); setTyping(true); }}><Icon name="pen" size={18} /> Edit as text</button>
            </>
          ) : (
            <>
              {live && <div className="card soft"><span className="label">You’re saying</span><p style={{ fontStyle: "italic" }}>{live}</p></div>}
              {busy && <div className="row"><Spinner /><span className="small muted">Checking your retelling…</span></div>}
              {typeInstead(finishRetell, "Votre résumé en français")}
              <button className="btn ghost" onClick={saveAll} disabled={busy}>Skip retelling, it’s optional</button>
            </>
          )}
          {err && <p className="err">{err}</p>}
          {!retell && supported && !typing && <MicDock recording={recording} onRestart={() => restart("fr-FR", finishRetell)} onToggle={() => toggle("fr-FR", finishRetell)} hint={recording ? `${timer} · tap to finish` : "Retell it in French"} />}
        </>
      )}

      {step === "results" && (
        <>
          <div className="stack" style={{ gap: 4 }}>
            <h1>Bravo !</h1>
            <p className="small muted">{text.title}</p>
          </div>
          <div className="row" style={{ gap: 10 }}>
            {[["Reading", reading?.score], ["Translation", translation?.score], ["Retelling", retell?.score]].map(([n, v]) => (
              <div className="metric" key={n as string}>
                <div><b>{v ?? "—"}</b>{v != null && <small>%</small>}</div>
                <span className="small muted">{n}</span>
              </div>
            ))}
          </div>
          {practiceWords.length > 0 && (
            <>
              <span className="label">Words to practice</span>
              <div className="card flat">
                {practiceWords.map((w) => (
                  <div className="list-row" key={w.word}>
                    <div className="grow"><div className="t">{w.word}</div><div className="s">{w.translation}</div></div>
                    <span className={"chip" + (w.reason === "pronunciation" ? " red" : "")}>{w.reason === "pronunciation" ? "pronunciation" : "meaning"}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {practiceWords.length > 0 && <button className="btn primary" onClick={() => nav("/words")}>Practice {practiceWords.length} words</button>}
          <button className={"btn" + (practiceWords.length ? "" : " primary")} onClick={nextPassage}>Next passage</button>
          <button className="btn ghost" onClick={() => nav("/")}>Back to texts</button>
        </>
      )}
    </div>
  );
}
