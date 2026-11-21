import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, type TextRow, type SessionRow } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { Icon, Progress, Spinner } from "../components/ui";
import { splitPassages } from "../lib/score";
import { streakDays, minutesToday } from "../lib/stats";

function greeting() {
  const h = new Date().getHours();
  return h >= 18 || h < 5 ? "Bonsoir" : "Bonjour";
}

export default function Library() {
  const { name } = useAuth();
  const [texts, setTexts] = useState<TextRow[] | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      const [{ data: t }, { data: s }] = await Promise.all([
        supabase.from("texts").select("*").order("created_at", { ascending: false }),
        supabase.from("sessions").select("*").order("created_at", { ascending: false }).limit(500),
      ]);
      setTexts(t ?? []);
      setSessions(s ?? []);
    })();
  }, []);

  const streak = streakDays(sessions);
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
                <h3 style={{ fontSize: 15 }}>{t.title}</h3>
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
    </div>
  );
}
