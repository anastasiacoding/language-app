import type { SessionRow } from "./supabase";

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export function streakDays(sessions: SessionRow[]): number {
  const days = new Set(sessions.map((s) => dayKey(new Date(s.created_at))));
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1); // a streak survives until the end of today
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function minutesToday(sessions: SessionRow[]): number {
  const k = dayKey(new Date());
  return Math.round(sessions.filter((s) => dayKey(new Date(s.created_at)) === k).reduce((a, s) => a + s.duration_sec, 0) / 60);
}
