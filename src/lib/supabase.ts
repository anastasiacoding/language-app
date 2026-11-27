import { createClient } from "@supabase/supabase-js";

// Public values: safe to ship in the app. Data is protected by Row Level Security in the database.
export const SUPABASE_URL = "https://sopybputouvalqmjqkcr.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_RBiZEF-rwKUKOJBDapqYDw_-SZBfGZ0";

// Links in our emails (password reset, email confirmation) come back with the session in the URL hash:
// #access_token=…&refresh_token=…&type=recovery. That works in any browser, unlike PKCE codes, which only
// work where the link was requested (the home-screen app and Safari don’t share storage on iPhone).
// The hash router also uses the hash, so we take the tokens out before anything else reads it.
export const linkAuth: { access_token?: string; refresh_token?: string; type?: string; error?: string } = {};
(() => {
  const h = window.location.hash;
  if (!/(^#|&)(access_token|error_description|error_code)=/.test(h.replace(/^#\/?/, "#"))) return;
  const p = new URLSearchParams(h.replace(/^#\/?/, ""));
  if (p.get("access_token")) {
    linkAuth.access_token = p.get("access_token")!;
    linkAuth.refresh_token = p.get("refresh_token") || "";
    linkAuth.type = p.get("type") || "";
  } else linkAuth.error = p.get("error_code") || p.get("error") || "link_error";
  window.history.replaceState(null, "", window.location.pathname + "#/");
})();

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  // PKCE puts the sign-in code in ?code=… instead of the URL hash, which the hash router uses.
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
});

/** Used only to request emails, so their links carry the session in the hash (see linkAuth above). */
export const supabaseLinks = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "sb-links" },
});

export type ConsentKind = "age" | "terms" | "voice" | "reminders" | "newsletter" | "analytics";

export interface TextRow {
  id: string;
  title: string;
  source: string;
  content: string;
  passage_index: number;
  created_at: string;
}

export interface SessionRow {
  id: string;
  text_id: string | null;
  reading: number | null;
  translation: number | null;
  retelling: number | null;
  duration_sec: number;
  created_at: string;
}

export interface WordRow {
  id: string;
  word: string;
  translation: string;
  reason: "pronunciation" | "meaning";
  text_id: string | null;
  reviews: number;
  correct_streak: number;
  learned: boolean;
  created_at: string;
}

export async function latestConsents(): Promise<Record<string, boolean>> {
  const { data } = await supabase.from("consents").select("kind, granted, created_at").order("created_at", { ascending: false });
  const out: Record<string, boolean> = {};
  for (const r of data ?? []) if (!(r.kind in out)) out[r.kind] = r.granted;
  return out;
}

export async function setConsent(kind: ConsentKind, granted: boolean) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  await supabase.from("consents").insert({ user_id: u.user.id, kind, granted });
}

export async function saveWords(words: { word: string; translation?: string; reason: "pronunciation" | "meaning"; text_id?: string | null }[]) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user || words.length === 0) return;
  const rows = words.map((w) => ({
    user_id: u.user!.id,
    word: w.word.slice(0, 100),
    translation: (w.translation ?? "").slice(0, 200),
    reason: w.reason,
    text_id: w.text_id ?? null,
  }));
  await supabase.from("words").upsert(rows, { onConflict: "user_id,word", ignoreDuplicates: true });
}
