import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, type SessionRow, type WordRow } from "../lib/supabase";
import { loadActivity, streakFrom, lastWeek, GRAMMAR_MIN, type ActivityRow } from "../lib/activity";
import { Lion } from "../components/Lion";
import { Icon, Progress as Bar, Seg, Spinner } from "../components/ui";

type Period = "week" | "month" | "all";

const COLORS = { reading: "#A4161A", translation: "#C39A4E", retelling: "#6F7378" } as const;

function Chart({ sessions }: { sessions: SessionRow[] }) {
  const pts = sessions.slice(0, 12).reverse();
  if (pts.length < 2) return <p className="small muted">Finish two texts to see how your scores change.</p>;
  const L = 34, W = 300, H = 150, T = 8, B = 8;
  const x = (i: number) => L + (i / (pts.length - 1)) * (W - L - 6);
  const y = (v: number) => T + (1 - v / 100) * (H - T - B);
  const line = (key: keyof typeof COLORS) => pts.map((s, i) => (s[key] == null ? null : `${x(i)},${y(s[key]!)}`)).filter(Boolean).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Your scores over your last texts, in percent">
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={L} x2={W} y1={y(v)} y2={y(v)} stroke="#E8E2DC" />
          <text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#6B5850">{v}%</text>
        </g>
      ))}
      {(Object.keys(COLORS) as (keyof typeof COLORS)[]).map((k) => (
        <g key={k}>
          <polyline points={line(k)} fill="none" stroke={COLORS[k]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={k === "retelling" ? "2 5" : undefined} />
          {pts.map((s, i) => (s[k] == null ? null : <circle key={i} cx={x(i)} cy={y(s[k]!)} r={i === pts.length - 1 ? 4 : 2.5} fill={COLORS[k]} />))}
        </g>
      ))}
    </svg>
  );
}

const avg = (a: (number | null)[]) => {
  const v = a.filter((x): x is number => x != null);
  return v.length ? Math.round(v.reduce((p, q) => p + q, 0) / v.length) : null;
};

const MOOD_TEXT: Record<string, (streak: number) => string> = {
  happy: (s) => (s > 0 ? `Your lion is proud of you: ${s}-day streak!` : "Your lion is ready. Read and translate a text, or practice grammar today."),
  neutral: () => "You missed yesterday. Your lion isn’t smiling.",
  sad: () => "Two days without French. Your lion is getting sad.",
  droopy: () => "Your lion’s mane is drooping. Come back and practice a little!",
};

export default function Progress() {
  const [period, setPeriod] = useState<Period>("month");
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [words, setWords] = useState<WordRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [showRule, setShowRule] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("sessions").select("*").order("created_at", { ascending: false }).limit(1000),
      supabase.from("words").select("*"),
      loadActivity(),
    ]).then(([s, w, a]) => {
      setSessions(s.data ?? []);
      setWords(w.data ?? []);
      setActivity(a);
    });
  }, []);

  if (!sessions) return <div className="screen" style={{ alignItems: "center", paddingTop: 80 }}><Spinner /></div>;

  const since = period === "week" ? Date.now() - 7 * 864e5 : period === "month" ? Date.now() - 30 * 864e5 : 0;
  const inPeriod = sessions.filter((s) => new Date(s.created_at).getTime() >= since);
  const minutes = Math.round(inPeriod.reduce((a, s) => a + s.duration_sec, 0) / 60);
  const learned = words.filter((w) => w.learned).length;
  const { streak, mood } = streakFrom(activity);
  const week = lastWeek(activity);
  const averages = {
    reading: avg(inPeriod.map((s) => s.reading)),
    translation: avg(inPeriod.map((s) => s.translation)),
    retelling: avg(inPeriod.map((s) => s.retelling)),
  };

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

      <div className="row" style={{ gap: 14, alignItems: "center", margin: "4px 0 6px" }}>
        <Lion mood={mood} size={92} />
        <div className="stack" style={{ gap: 4, minWidth: 0 }}>
          <div className="row" style={{ gap: 6 }}>
            <Icon name="flame" size={18} color="#B9592D" />
            <b style={{ fontSize: 20 }}>{streak}</b>
            <span className="muted">day streak</span>
          </div>
          <p className="small" style={{ margin: 0 }}>{MOOD_TEXT[mood](streak)}</p>
        </div>
      </div>
      <div className="stack" style={{ alignItems: "center", gap: 8 }}>
        <div className="row" style={{ gap: 8 }}>
          {week.map((d) => (
            <div key={d.day} className="stack" style={{ alignItems: "center", gap: 4 }}>
              <span style={{ width: 26, height: 26, borderRadius: 13, display: "grid", placeItems: "center", background: d.kinds.size ? "var(--scarlet)" : "var(--tint)", color: d.kinds.size ? "#FFF3E6" : "var(--muted)" }}>
                {d.kinds.size ? <Icon name="check" size={14} color="#FFF3E6" width={2.4} /> : null}
              </span>
              <span className="xs muted">{d.label}</span>
            </div>
          ))}
        </div>
        <button className="btn ghost sm" onClick={() => setShowRule(!showRule)}>How does the streak work?</button>
        {showRule && (
          <div className="notice" style={{ width: "100%" }}>
            A day counts when you either <b>read and translate a text</b> (retelling is a bonus, not required) or <b>practice grammar</b> ({GRAMMAR_MIN}+ examples). Reviewing words and checking genders don’t count. Miss one day and your lion stops smiling, two days and it gets sad, three days and its mane droops. Practice again and it cheers up right away.
          </div>
        )}
      </div>

      <Seg items={[{ id: "week", label: "Week" }, { id: "month", label: "Month" }, { id: "all", label: "All time" }]} value={period} onChange={setPeriod} />
      <div className="row" style={{ gap: 10 }}>
        <div className="metric"><b>{inPeriod.length}</b><div className="xs muted">texts</div></div>
        <div className="metric"><b>{minutes}</b><div className="xs muted">minutes</div></div>
        <div className="metric"><b>{words.length}</b><div className="xs muted">words saved</div></div>
      </div>

      <div className="card">
        <h3>Your average scores</h3>
        <div className="row" style={{ gap: 10 }}>
          {(["reading", "translation", "retelling"] as const).map((k) => (
            <div key={k} className="stack" style={{ flex: 1, gap: 2 }}>
              <span className="row xs muted" style={{ gap: 6 }}><i style={{ width: 8, height: 8, borderRadius: 4, background: COLORS[k] }} />{k[0].toUpperCase() + k.slice(1)}</span>
              <b style={{ fontSize: 24 }}>{averages[k] ?? "—"}{averages[k] != null && <small style={{ fontSize: 14, color: "var(--muted)" }}>%</small>}</b>
            </div>
          ))}
        </div>
        <Chart sessions={inPeriod} />
        <p className="xs muted">Each point is one finished text, newest on the right.</p>
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
