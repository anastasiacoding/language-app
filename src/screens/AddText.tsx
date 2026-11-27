import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Header, Icon, Seg, Spinner } from "../components/ui";
import { searchBooks, openBook, openLink, splitChapters, sourceStatus, type BookHit, type Chapter, type Source } from "../lib/books";
import { track } from "../lib/analytics";

type Mode = "menu" | "paste" | "link" | "photo" | "books" | "chapters";
type Lib = Source | "gallica";
const SUGGEST = ["Jules Verne", "Maupassant", "Perrault", "La Fontaine", "Alexandre Dumas", "Victor Hugo", "Colette", "Alphonse Daudet"];

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
  const [lib, setLib] = useState<Lib>("wikisource");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<BookHit[] | null>(null);
  const [book, setBook] = useState<{ title: string; author?: string; source: Source; chapters: Chapter[] } | null>(null);
  const searchRef = useRef<() => void>();
  const [gutenbergOk, setGutenbergOk] = useState<boolean | null>(null);
  // Checks every time the screen opens: Gutenberg turns on by itself once it's back online.
  useEffect(() => {
    sourceStatus().then((r) => setGutenbergOk(r.gutenberg)).catch(() => setGutenbergOk(false));
  }, []);
  const soon = lib === "gallica" || (lib === "gutenberg" && gutenbergOk === false);
  const nav = useNavigate();

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const sourceLabel = (src: Source) => (src === "wikisource" ? "Wikisource" : "Project Gutenberg");

  /** Shows a book's text: straight to the editor if short, otherwise as a list of chapters. */
  const showOpened = (src: Source, title: string, author: string | undefined, r: Awaited<ReturnType<typeof openBook>>) => {
    if (r.kind === "chapters") {
      const chapters = r.chapters.filter((c) => !/texte entier|seule page/i.test(c.id + " " + c.title)).map((c) => ({ id: c.id, title: c.title }));
      setBook({ title: r.title, author, source: src, chapters });
      setMode("chapters");
      return;
    }
    if (r.text.length > 12000) {
      setBook({ title: r.title || title, author, source: src, chapters: splitChapters(r.text) });
      setMode("chapters");
      return;
    }
    setTitle(r.title || title);
    setText(r.text);
    setSource(sourceLabel(src));
    setMode("paste");
  };

  const search = async (query = q) => {
    if (lib === "gallica") return;
    setErr("");
    setBusy(true);
    setHits(null);
    try {
      setHits(await searchBooks(lib, query.trim()));
    } catch (e: any) {
      setErr(e.message);
    }
    setBusy(false);
  };

  searchRef.current = () => search(q);

  const open = async (h: BookHit) => {
    if (lib === "gallica") return;
    setErr("");
    setBusy(true);
    try {
      showOpened(lib, h.title, h.author, await openBook(lib, h.id));
    } catch (e: any) {
      setErr(e.message);
    }
    setBusy(false);
  };

  const openChapter = async (c: Chapter) => {
    if (!book) return;
    const t = `${book.title} · ${c.title}`.slice(0, 200);
    if (c.text) {
      setTitle(t);
      setText(c.text);
      setSource(sourceLabel(book.source));
      setMode("paste");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      const r = await openBook(book.source, c.id!);
      if (r.kind === "text") {
        setTitle(t);
        setText(r.text.slice(0, 45000));
        setSource(sourceLabel(book.source));
        setMode("paste");
      } else showOpened(book.source, t, book.author, r);
    } catch (e: any) {
      setErr(e.message);
    }
    setBusy(false);
  };

  const loadLink = async () => {
    setErr("");
    const raw = link.trim();
    try {
      new URL(raw);
    } catch {
      return setErr("Paste a full web address that starts with https://");
    }
    setBusy(true);
    try {
      const host = new URL(raw).hostname;
      const src: Source = /gutenberg/.test(host) ? "gutenberg" : "wikisource";
      const r = await openLink(raw);
      if (/wikisource|gutenberg/.test(host)) showOpened(src, r.kind === "text" ? r.title || "" : r.title, undefined, r);
      else if (r.kind === "text") {
        if (r.text.length > 12000) {
          setBook({ title: r.title || host, source: "wikisource", chapters: splitChapters(r.text) });
          setSource(host.replace(/^www\./, ""));
          setMode("chapters");
        } else {
          setTitle(r.title || "");
          setText(r.text);
          setSource(host.replace(/^www\./, ""));
          setMode("paste");
        }
      }
    } catch (e: any) {
      setErr(e.message || "Couldn’t load that link.");
    }
    setBusy(false);
  };

  const runOcr = async (files: File[]) => {
    setErr("");
    setBusy(true);
    setProgress(0);
    try {
      // Runs entirely in the browser: images never leave the device.
      const { createWorker } = await import("tesseract.js");
      let page = 0;
      const worker = await createWorker("fra", 1, {
        logger: (m: any) => m.status === "recognizing text" && setProgress(Math.round(((page + m.progress) / files.length) * 100)),
      });
      const parts: string[] = [];
      for (const f of files) {
        const { data } = await worker.recognize(f);
        parts.push(data.text.replace(/-\n/g, "").replace(/([^\n])\n(?!\n)/g, "$1 ").replace(/[ \t]+/g, " ").trim());
        page++;
      }
      await worker.terminate();
      const clean = parts.filter(Boolean).join("\n\n");
      if (clean.length < 20) throw new Error("No text found. Try sharper screenshots or a photo with good light.");
      setText((t) => (t.trim() ? t.trim() + "\n\n" : "") + clean);
      if (!source) setSource(files.length > 1 ? `${files.length} screenshots` : "Photo");
      setMode("paste");
    } catch (e: any) {
      setErr(e.message || "Couldn’t read the image.");
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
    track("add_text", "add", `${text.trim().split(/\s+/).length} words`);
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
      <Header title="New text" onBack={mode === "menu" ? undefined : () => setMode(mode === "chapters" ? (hits ? "books" : "menu") : mode === "paste" && book ? "chapters" : "menu")} />
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { const fs = Array.from(e.target.files ?? []); e.target.value = ""; if (fs.length) runOcr(fs.slice(0, 20)); }} />

      {mode === "menu" && (
        <>
          <Option icon="camera" title="Photos or screenshots" sub="Pick one or several pages · read on your phone" onClick={() => fileRef.current?.click()} />
          <Option icon="book" title="Free books" sub="Wikisource now · Gutenberg and Gallica soon" onClick={() => { setMode("books"); if (!hits) search(""); }} />
          <Option icon="link" title="Link" sub="An open article or book page" onClick={() => setMode("link")} />
          <Option icon="clip" title="Paste text" sub="From clipboard" onClick={() => setMode("paste")} />
          <div className="card tint" style={{ gap: 6 }}>
            <h3 style={{ fontSize: 14 }}>Open texts only</h3>
            <p className="small" style={{ color: "#5B4034" }}>Use public-domain texts, such as classics from Wikisource, Project Gutenberg or Gallica. Photos never leave your phone: text is recognized on the device.</p>
          </div>
        </>
      )}

      {mode === "link" && (
        <>
          <label className="field"><span>Book link</span><input className="input" inputMode="url" placeholder="https://…" value={link} onChange={(e) => setLink(e.target.value)} /></label>
          <p className="xs muted">Works with most open article and book pages, including fr.wikisource.org and gutenberg.org. Gallica doesn’t allow apps, so take screenshots of its pages instead.</p>
          <button className="btn primary" onClick={loadLink} disabled={busy || !link.trim()}>{busy ? "Loading…" : "Load text"}</button>
        </>
      )}

      {busy && progress > 0 && (
        <div className="card row"><Spinner /><span className="small">Reading the pages… {progress}%</span></div>
      )}

      {mode === "books" && (
        <>
          <Seg items={[{ id: "wikisource", label: "Wikisource" }, { id: "gutenberg", label: gutenbergOk === false ? "Gutenberg · soon" : "Gutenberg" }, { id: "gallica", label: "Gallica · soon" }]} value={lib} onChange={(v: Lib) => { setLib(v); setHits(null); setErr(""); if (v === "wikisource" || (v === "gutenberg" && gutenbergOk !== false)) setTimeout(() => searchRef.current?.(), 0); }} />
          {!soon && <form className="card row" style={{ padding: "10px 14px", gap: 10, flexDirection: "row" }} onSubmit={(e) => { e.preventDefault(); search(); }}>
            <Icon name="search" size={20} color="#6B5850" />
            <input className="grow" style={{ border: 0, outline: 0, background: "none", fontSize: 16 }} placeholder="Title or author" value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
            <button className="chip" type="submit">Search</button>
          </form>}
          {!soon && <div className="hscroll">
            {SUGGEST.map((s) => <button key={s} className="pill" onClick={() => { setQ(s); search(s); }}>{s}</button>)}
          </div>}

          {soon ? (
            <div className="card tint" style={{ gap: 8, alignItems: "flex-start" }}>
              <span className="chip">Coming soon</span>
              <h3 style={{ fontSize: 15 }}>{lib === "gallica" ? "Gallica isn’t connected yet" : "Project Gutenberg is offline right now"}</h3>
              <p className="small" style={{ color: "#5B4034" }}>
                {lib === "gallica"
                  ? "The French National Library doesn’t let apps load its books yet. Until then, you can take screenshots of Gallica pages and add them with Photos or screenshots."
                  : "Gutenberg’s website is down for maintenance. The app checks every time you open this screen and switches it on by itself once it’s back."}
              </p>
              {lib === "gallica" && <button className="btn sm" onClick={() => { setSource("Gallica (BnF)"); fileRef.current?.click(); }}><Icon name="camera" size={18} /> Add screenshots</button>}
            </div>
          ) : busy ? (
            <div className="row" style={{ justifyContent: "center", padding: 20 }}><Spinner /></div>
          ) : hits && hits.length === 0 ? (
            <p className="empty small">No French books found. Try an author’s name.</p>
          ) : hits ? (
            <div className="card flat">
              {hits.map((h) => (
                <div key={h.id} className="list-row" role="button" onClick={() => open(h)}>
                  <div className="grow"><div className="t">{h.title}</div>{(h.author || h.year) && <div className="s">{[h.author, h.year].filter(Boolean).join(" · ")}</div>}</div>
                  <Icon name="chev" size={18} color="#6B5850" />
                </div>
              ))}
            </div>
          ) : null}
          {lib === "gutenberg" && !soon && <p className="xs muted">Only books whose authors died before 1956, so they’re in the public domain in France.</p>}
        </>
      )}

      {mode === "chapters" && book && (
        <>
          <div className="stack" style={{ gap: 2 }}>
            <h2>{book.title}</h2>
            <span className="small muted">{[book.author, sourceLabel(book.source), `${book.chapters.length} chapters`].filter(Boolean).join(" · ")}</span>
          </div>
          {busy ? (
            <div className="row" style={{ justifyContent: "center", padding: 20 }}><Spinner /></div>
          ) : (
            <div className="card flat">
              {book.chapters.map((c, i) => (
                <div key={i} className="list-row" role="button" onClick={() => openChapter(c)}>
                  <div className="grow"><div className="t">{c.title}</div>{c.text && <div className="s">{Math.round(c.text.split(/\s+/).length / 10) * 10} words</div>}</div>
                  <Icon name="chev" size={18} color="#6B5850" />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {mode === "paste" && (
        <>
          <label className="field"><span>Title</span><input className="input" placeholder="Le Petit Chaperon rouge" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label className="field"><span>French text</span><textarea className="input" style={{ minHeight: "55vh" }} placeholder="Il était une fois…" value={text} onChange={(e) => setText(e.target.value)} /></label>
          <button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => fileRef.current?.click()}><Icon name="camera" size={18} /> Add more screenshots</button>
          <p className="xs muted">{words} words{source ? ` · from ${source}` : ""}</p>
          <button className="btn primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Start reading"}</button>
        </>
      )}
      {err && <p className="err">{err}</p>}
    </div>
  );
}
