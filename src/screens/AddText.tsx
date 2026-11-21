import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Header, Icon, Spinner } from "../components/ui";

type Mode = "menu" | "paste" | "link" | "photo";

/** Fetches a page from French Wikisource (which allows cross-site requests) and returns plain text. */
async function fromWikisource(url: string): Promise<{ title: string; text: string }> {
  const u = new URL(url);
  if (!/(^|\.)wikisource\.org$/.test(u.hostname)) throw new Error("For now only links from fr.wikisource.org work. For other sites, copy the text and use Paste text.");
  const m = u.pathname.match(/\/wiki\/(.+)$/);
  if (!m) throw new Error("This doesn’t look like a Wikisource page link.");
  const page = decodeURIComponent(m[1]);
  const api = `https://${u.hostname}/w/api.php?action=parse&format=json&origin=*&prop=text&redirects=1&page=${encodeURIComponent(page)}`;
  const res = await fetch(api);
  const json = await res.json();
  if (json.error) throw new Error("Page not found on Wikisource.");
  const doc = new DOMParser().parseFromString(json.parse.text["*"], "text/html");
  doc.querySelectorAll(".ws-noexport, .reference, .references, .mw-editsection, table, style, sup, .noprint, #headertemplate, .headertemplate").forEach((n) => n.remove());
  const paras = Array.from(doc.querySelectorAll("p, .poem"))
    .map((p) => p.textContent?.replace(/\s+/g, " ").trim() ?? "")
    .filter((t) => t.length > 30);
  const text = paras.join("\n\n").slice(0, 50000);
  if (text.length < 50) throw new Error("No readable text found on that page. Try the page of a single chapter.");
  return { title: json.parse.title.replace(/\//g, " · "), text };
}

export default function AddText() {
  const [mode, setMode] = useState<Mode>("menu");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const loadLink = async () => {
    setErr("");
    setBusy(true);
    try {
      const r = await fromWikisource(link.trim());
      setTitle(r.title);
      setText(r.text);
      setSource("Wikisource");
      setMode("paste");
    } catch (e: any) {
      setErr(e.message || "Couldn’t load that link.");
    }
    setBusy(false);
  };

  const runOcr = async (file: File) => {
    setErr("");
    setBusy(true);
    setProgress(0);
    try {
      // Runs entirely in the browser: the image never leaves the device.
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("fra", 1, {
        logger: (m: any) => m.status === "recognizing text" && setProgress(Math.round(m.progress * 100)),
      });
      const { data } = await worker.recognize(file);
      await worker.terminate();
      const clean = data.text.replace(/-\n/g, "").replace(/([^\n])\n(?!\n)/g, "$1 ").replace(/[ \t]+/g, " ").trim();
      if (clean.length < 20) throw new Error("No text found. Try a sharper photo with good light.");
      setText(clean);
      setSource("Photo");
      setMode("paste");
    } catch (e: any) {
      setErr(e.message || "Couldn’t read the photo.");
    }
    setBusy(false);
  };

  const save = async () => {
    setErr("");
    if (!text.trim()) return setErr("Add some French text first.");
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const t = title.trim() || text.trim().split(/\s+/).slice(0, 5).join(" ") + "…";
    const { data, error } = await supabase
      .from("texts")
      .insert({ user_id: u.user!.id, title: t.slice(0, 200), source: source.slice(0, 300), content: text.trim().slice(0, 50000) })
      .select("id")
      .single();
    setBusy(false);
    if (error) return setErr(error.message);
    nav(`/session/${data.id}`, { replace: true });
  };

  const Option = ({ icon, title, sub, onClick }: any) => (
    <button className="card" style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16, cursor: "pointer", textAlign: "left" }} onClick={onClick}>
      <span style={{ width: 44, height: 44, minWidth: 44, borderRadius: 12, background: "var(--tint)", display: "grid", placeItems: "center" }}>
        <Icon name={icon} color="#5B4034" />
      </span>
      <span className="grow stack" style={{ gap: 2 }}>
        <b style={{ fontSize: 16 }}>{title}</b>
        <span className="small muted">{sub}</span>
      </span>
      <Icon name="chev" size={20} color="#6B5850" />
    </button>
  );

  return (
    <div className="screen">
      <Header title="New text" onBack={mode === "menu" ? undefined : () => setMode("menu")} />
      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && runOcr(e.target.files[0])} />

      {mode === "menu" && (
        <>
          <Option icon="camera" title="Photo or screenshot" sub="Recognized right on your phone" onClick={() => fileRef.current?.click()} />
          <Option icon="link" title="Link" sub="A page from fr.wikisource.org" onClick={() => setMode("link")} />
          <Option icon="clip" title="Paste text" sub="From clipboard" onClick={() => setMode("paste")} />
          <div className="card tint" style={{ gap: 6 }}>
            <h3 style={{ fontSize: 14 }}>Open texts only</h3>
            <p className="small" style={{ color: "#5B4034" }}>Use public-domain texts, such as classics from Wikisource, Project Gutenberg or Gallica. Photos never leave your phone: text is recognized on the device.</p>
          </div>
        </>
      )}

      {mode === "link" && (
        <>
          <label className="field"><span>Wikisource link</span><input className="input" inputMode="url" placeholder="https://fr.wikisource.org/wiki/…" value={link} onChange={(e) => setLink(e.target.value)} /></label>
          <button className="btn primary" onClick={loadLink} disabled={busy || !link.trim()}>{busy ? "Loading…" : "Load text"}</button>
        </>
      )}

      {busy && mode === "menu" && (
        <div className="card row"><Spinner /><span className="small">Recognizing text… {progress}%</span></div>
      )}

      {mode === "paste" && (
        <>
          <label className="field"><span>Title</span><input className="input" placeholder="Le Petit Chaperon rouge" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label className="field"><span>French text</span><textarea className="input" placeholder="Il était une fois…" value={text} onChange={(e) => setText(e.target.value)} /></label>
          <p className="xs muted">{words} words{source ? ` · from ${source}` : ""}</p>
          <button className="btn primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Start reading"}</button>
        </>
      )}
      {err && <p className="err">{err}</p>}
    </div>
  );
}
