import { supabase } from "./supabase";
import type { Mood } from "../components/Lion";

// A day counts toward the streak when you read and translate a text (retelling is optional)
// or practice grammar (at least 5 examples). Reviewing words doesn't count.
export const GRAMMAR_MIN = 5;

export function localDay(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function recordActivity(kind: "text" | "grammar") {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  await supabase.from("activity").upsert({ user_id: u.user.id, day: localDay(), kind, count: 1 }, { onConflict: "user_id,day,kind", ignoreDuplicates: true });
}

export interface ActivityRow {
  day: string;
  kind: "text" | "grammar";
}

export async function loadActivity(): Promise<ActivityRow[]> {
  const { data } = await supabase.from("activity").select("day, kind").order("day", { ascending: false }).limit(1000);
  return (data ?? []) as ActivityRow[];
}

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export function streakFrom(rows: ActivityRow[]) {
  const days = new Set(rows.map((r) => r.day));
  const today = new Date();
  let cursor = days.has(localDay(today)) ? today : addDays(today, -1); // today still counts until midnight
  let streak = 0;
  while (days.has(localDay(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  // missed days: full days without activity since the last active day (today isn't over yet)
  let missed = 0;
  if (!days.has(localDay(today))) {
    let d = addDays(today, -1);
    while (!days.has(localDay(d)) && missed < 60) {
      missed++;
      d = addDays(d, -1);
    }
    if (rows.length === 0) missed = 0;
  }
  const mood: Mood = missed === 0 ? "happy" : missed === 1 ? "neutral" : missed === 2 ? "sad" : "droopy";
  return { streak, missed, mood, activeToday: days.has(localDay(today)) };
}

/** The last 7 days, oldest first, with what was done each day. */
export function lastWeek(rows: ActivityRow[]) {
  const map = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!map.has(r.day)) map.set(r.day, new Set());
    map.get(r.day)!.add(r.kind);
  }
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i - 6);
    const k = localDay(d);
    return { day: k, label: d.toLocaleDateString("en-GB", { weekday: "narrow" }), kinds: map.get(k) ?? new Set<string>() };
  });
}
