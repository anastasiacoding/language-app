import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, type TextRow, type SessionRow } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Icon, Modal, Progress, Spinner } from "../components/ui";
import { splitPassages } from "../lib/score";
import { FEEDBACK_URL } from "./About";
import { minutesToday } from "../lib/stats";
import { loadActivity, streakFrom, type ActivityRow } from "../lib/activity";

function greeting() {
  const h = new Date().getHours();
  return h >= 18 || h < 5 ? "Bonsoir" : "Bonjour";
}

export default function Library() {
  const { name } = useAuth();
  const [texts, setTexts] = useState<TextRow[] | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const nav = useNavigate();
  const [toDelete, setToDelete] = useState<TextRow | null>(null);

  const remove = async () => {
    if (!toDelete) return;
    // sessions and saved words keep their scores: their text_id is set to null in the database
    await supabase.from("texts").delete().eq("id", toDelete.id);
    setTexts((t) => (t ?? []).filter((x) => x.id !== toDelete.id));
    setToDelete(null);
  };

  useEffect(() => {
    (async () => {
      const [{ data: t }, { data: s }] = await Promise.all([
        supabase.from("texts").select("*").order("created_at", { ascending: false }),
        supabase.from("sessions").select("*").order("created_at", { ascending: false }).limit(500),
      ]);
      setTexts(t ?? []);
      setSessions(s ?? []);
      setActivity(await loadActivity());
    })();
  }, []);

  const { streak } = streakFrom(activity);
  const today = minutesToday(sessions);

  return (
    <div className="screen">
      <div className="row between" style={{ alignItems: "flex-start" }}>
        <div className="stack" style={{ gap: 4 }}>
          <h1>{greeting()}{name ? `, ${name}` : ""}</h1>
          <div className="row small muted" style={{ gap: 6 }}>
            <Icon name="flame" size={18} color="#B9592D" />
            {streak ? `${streak}-day streak` : "Start your streak today"} · {today} min today
          </div>
        </div>
        <Link to="/profile" aria-label="Profile" style={{ width: 40, height: 40, borderRadius: 20, background: "var(--scarlet)", color: "#FFF3E6", display: "grid", placeItems: "center", fontWeight: 700, textDecoration: "none" }}>
          {(name || "?").slice(0, 1).toUpperCase()}
        </Link>
      </div>

      <p className="small muted" style={{ margin: "-4px 0 0" }}>Add your text to practice French reading, translation and retelling.</p>
      <Link to="/add" className="btn"><Icon name="plus" size={20} /> Add text</Link>

      {texts === null ? (
        <div className="row" style={{ justifyContent: "center", padding: 30 }}><Spinner /></div>
      ) : texts.length === 0 ? (
        <div className="card tint stack">
          <h3>Add your first text</h3>
          <p className="small">Take a photo of a page, paste a passage, or bring a link from fr.wikisource.org. Short public-domain texts work best: fables, tales, classic novels.</p>
        </div>
      ) : (
        <>
          <span className="label">Continue</span>
          {texts.map((t) => {
            const passages = splitPassages(t.content);
            const last = sessions.find((s) => s.text_id === t.id);
            const pct = passages.length ? Math.round((Math.min(t.passage_index, passages.length) / passages.length) * 100) : 0;
            return (
              <button key={t.id} className="card" style={{ textAlign: "left", cursor: "pointer", gap: 8 }} onClick={() => nav(`/session/${t.id}`)}>
                <div className="row" style={{ alignItems: "flex-start" }}>
                  <h3 className="grow" style={{ fontSize: 15 }}>{t.title}</h3>
                  <span role="button" aria-label={`Delete ${t.title}`} className="icon-btn" style={{ margin: "-4px -6px 0 0" }} onClick={(e) => { e.stopPropagation(); setToDelete(t); }}>
                    <Icon name="trash" size={18} color="#6B5850" />
                  </span>
                </div>
                <p className="small muted" style={{ fontStyle: "italic", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {t.content.slice(0, 160)}
                </p>
                <div className="row wrap" style={{ gap: 6 }}>
                  {last ? (
                    <>
                      {last.reading != null && <span className="chip">Reading {last.reading}%</span>}
                      {last.translation != null && <span className="chip">Translation {last.translation}%</span>}
                    </>
                  ) : (
                    <span className="chip">New</span>
                  )}
                  <span className="grow" />
                  <span className="xs muted">{t.source || "Your text"} · {Math.min(t.passage_index, passages.length)}/{passages.length}</span>
                </div>
                <Progress value={pct} />
              </button>
            );
          })}
        </>
      )}
      <p className="small center" style={{ marginTop: "auto", padding: "18px 0 4px", color: "var(--muted)" }}>
        <Link to="/about" style={{ color: "var(--muted)" }}>About the app</Link>
        <span aria-hidden="true"> · </span>
        <a href={FEEDBACK_URL} style={{ color: "var(--muted)" }}>Send feedback</a>
      </p>
      {toDelete && (
        <Modal onClose={() => setToDelete(null)}>
          <h2>Delete this text?</h2>
          <p className="small">“{toDelete.title}” will be removed from your library. Your scores, streak and saved words stay in Progress.</p>
          <button className="btn primary" onClick={remove}>Delete text</button>
          <button className="btn" onClick={() => setToDelete(null)}>Cancel</button>
        </Modal>
      )}
    </div>
  );
}
