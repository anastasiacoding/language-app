import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, type SessionRow, type WordRow } from "../lib/supabase";
import { streakDays } from "../lib/stats";
import { Icon, Progress as Bar, Seg, Spinner } from "../components/ui";

type Period = "week" | "month" | "all";

function Chart({ sessions }: { sessions: SessionRow[] }) {
  const pts = sessions.slice(0, 12).reverse();
  if (pts.length < 2) return <p className="small muted">Complete two sessions to see your accuracy trend.</p>;
  const W = 300, H = 130;
  const x = (i: number) => (i / (pts.length - 1)) * W;
  const y = (v: number) => H - 8 - (v / 100) * (H - 16);
  const line = (key: "reading" | "translation" | "retelling") =>
    pts.map((s, i) => (s[key] == null ? null : `${x(i)},${y(s[key]!)}`)).filter(Boolean).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Accuracy over your last sessions">
      {[25, 50, 75].map((v) => <line key={v} x1="0" x2={W} y1={y(v)} y2={y(v)} stroke="#E8E2DC" />)}
      <polyline points={line("retelling")} fill="none" stroke="#8E9297" strokeWidth="2.5" strokeDasharray="1 5" strokeLinecap="round" />
      <polyline points={line("translation")} fill="none" stroke="#C39A4E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={line("reading")} fill="none" stroke="#A4161A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const avg = (a: (number | null)[]) => {
  const v = a.filter((x): x is number => x != null);
  return v.length ? Math.round(v.reduce((p, q) => p + q, 0) / v.length) : null;
};

export default function Progress() {
  const [period, setPeriod] = useState<Period>("month");
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [words, setWords] = useState<WordRow[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("sessions").select("*").order("created_at", { ascending: false }).limit(1000),
      supabase.from("words").select("*"),
    ]).then(([s, w]) => {
      setSessions(s.data ?? []);
      setWords(w.data ?? []);
    });
  }, []);

  if (!sessions) return <div className="screen" style={{ alignItems: "center", paddingTop: 80 }}><Spinner /></div>;

  const since = period === "week" ? Date.now() - 7 * 864e5 : period === "month" ? Date.now() - 30 * 864e5 : 0;
  const inPeriod = sessions.filter((s) => new Date(s.created_at).getTime() >= since);
  const minutes = Math.round(inPeriod.reduce((a, s) => a + s.duration_sec, 0) / 60);
  const learned = words.filter((w) => w.learned).length;

  const sounds: Record<string, number> = { "[ʁ]  r": 0, "[y]  u": 0, "nasal  an / on / in": 0, "[ø]  eu": 0 };
  for (const w of words.filter((x) => x.reason === "pronunciation")) {
    const s = w.word.toLowerCase();
    if (s.includes("r")) sounds["[ʁ]  r"]++;
    if (/(^|[^oaeu])u/.test(s)) sounds["[y]  u"]++;
    if (/(an|en|on|in|un|ain|ein)([^aeiouyn]|$)/.test(s)) sounds["nasal  an / on / in"]++;
    if (/eu|œu/.test(s)) sounds["[ø]  eu"]++;
  }
  const tricky = Object.entries(sounds).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="screen">
      <h1>Progress</h1>
      <Seg items={[{ id: "week", label: "Week" }, { id: "month", label: "Month" }, { id: "all", label: "All time" }]} value={period} onChange={setPeriod} />
      <div className="row" style={{ gap: 10 }}>
        <div className="metric"><b>{inPeriod.length}</b><div className="xs muted">sessions</div></div>
        <div className="metric"><b>{minutes}</b><div className="xs muted">minutes</div></div>
        <div className="metric"><b>{streakDays(sessions)}</b><div className="xs muted">day streak</div></div>
      </div>
      <div className="card">
        <h3>Accuracy, %</h3>
        <Chart sessions={inPeriod} />
        <div className="row wrap small muted" style={{ gap: 14 }}>
          <span className="row" style={{ gap: 6 }}><i style={{ width: 8, height: 8, borderRadius: 4, background: "#A4161A" }} />Reading {avg(inPeriod.map((s) => s.reading)) ?? "—"}</span>
          <span className="row" style={{ gap: 6 }}><i style={{ width: 8, height: 8, borderRadius: 4, background: "#C39A4E" }} />Translation {avg(inPeriod.map((s) => s.translation)) ?? "—"}</span>
          <span className="row" style={{ gap: 6 }}><i style={{ width: 8, height: 8, borderRadius: 4, background: "#8E9297" }} />Retelling {avg(inPeriod.map((s) => s.retelling)) ?? "—"}</span>
        </div>
      </div>
      <Link to="/words" className="card" style={{ textDecoration: "none", color: "inherit", gap: 8 }}>
        <div className="row between">
          <h3>My words</h3>
          <span className="row xs muted" style={{ gap: 4 }}>{learned} of {words.length} learned <Icon name="chev" size={16} /></span>
        </div>
        <Bar value={words.length ? (learned / words.length) * 100 : 0} />
      </Link>
      {tricky.length > 0 && (
        <div className="card" style={{ gap: 8 }}>
          <h3>Tricky sounds</h3>
          <div className="row wrap" style={{ gap: 6 }}>{tricky.map(([s]) => <span key={s} className="chip">{s}</span>)}</div>
        </div>
      )}
    </div>
  );
}
