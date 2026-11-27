// Word lookups from two open dictionaries, split into small files in public/ and loaded only when needed:
// • public/ipa/   IPA transcriptions — open-dict-data/ipa-dict, fr_FR (MIT licence)
// • public/gloss/ short English meanings — Wiktionary (CC BY-SA 4.0) via Vuizur/Wiktionary-Dictionaries

type Shard = Record<string, string>;
const cache = new Map<string, Promise<Shard>>();

/** First two letters without accents, padded with "_" — must match scripts/build-*.py */
function shardKey(w: string) {
  const s = w.toLowerCase().replace(/œ/g, "o").replace(/æ/g, "a").normalize("NFD").replace(/[^a-z]/g, "");
  return s ? (s.slice(0, 2) + "_").slice(0, 2) : "__";
}

function shard(dir: "ipa" | "gloss", w: string) {
  const id = `${dir}/${shardKey(w)}`;
  let p = cache.get(id);
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}${id}.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
    cache.set(id, p);
    p.then((d) => Object.keys(d).length === 0 && cache.delete(id)); // retry later if it failed
  }
  return p;
}

async function exact(dir: "ipa" | "gloss", w: string): Promise<string | null> {
  if (!w) return null;
  return (await shard(dir, w))[w] ?? null;
}

/** Lower-cased word without surrounding punctuation, with straight apostrophes turned curly. */
export function cleanToken(raw: string) {
  return raw
    .toLowerCase()
    .replace(/'/g, "’")
    .replace(/^[«"“(\[—–\-…]+|[»"”)\].,;:!?…]+$/g, "")
    .trim();
}

const ELIDED_RE = /^(jusqu|lorsqu|puisqu|qu|[ldjmtsnc])’(.+)$/;
// Elided words before an apostrophe: l’homme = l + homme
const ELIDED_IPA: Record<string, string> = { l: "l", d: "d", j: "ʒ", m: "m", t: "t", s: "s", n: "n", c: "s", qu: "k", jusqu: "ʒysk", lorsqu: "lɔʁsk", puisqu: "pɥisk" };

// ───────────── pronunciation ─────────────

async function ipaLookup(w: string): Promise<string | null> {
  const hit = await exact("ipa", w);
  if (hit) return hit;
  const el = w.match(ELIDED_RE);
  if (el) {
    const rest = await ipaLookup(el[2]);
    return rest ? rest.split(", ").map((p) => ELIDED_IPA[el[1]] + p).join(", ") : null;
  }
  if (w.includes("-")) {
    const parts = await Promise.all(w.split("-").filter(Boolean).map(ipaLookup));
    if (parts.every(Boolean)) return parts.map((p) => p!.split(", ")[0]).join("‿");
  }
  for (const alt of [w.replace(/[sx]$/, ""), w.replace(/ent$/, "e"), w.replace(/es$/, "e")]) {
    if (alt !== w) {
      const a = await exact("ipa", alt);
      if (a) return a;
    }
  }
  return null;
}

/** IPA for a French word or short phrase, e.g. "/ɔm/". Several pronunciations are separated by " · ". */
export async function ipa(raw: string): Promise<string | null> {
  const w = cleanToken(raw);
  if (!w) return null;
  const words = w.split(/\s+/);
  if (words.length > 1) {
    const parts = await Promise.all(words.map((x) => ipaLookup(cleanToken(x))));
    if (!parts.every(Boolean)) return null;
    return "/" + parts.map((p) => p!.split(", ")[0]).join(" ") + "/";
  }
  const r = await ipaLookup(w);
  return r ? r.split(", ").slice(0, 3).map((p) => `/${p}/`).join(" · ") : null;
}

// ───────────── meaning ─────────────

async function resolve(v: string): Promise<string | null> {
  // "gloss", "=lemma" (an inflected form) or "gloss||=lemma" (a word that is also a form of another one)
  const [own, ptr] = v.startsWith("=") ? ["", v] : v.split("||");
  if (!ptr) return own;
  const lemma = ptr.slice(1);
  const lg = await exact("gloss", lemma);
  const lemmaGloss = lg && !lg.startsWith("=") ? lg.split("||")[0] : null;
  if (!own) return lemmaGloss;
  return lemmaGloss ? `${own} · (${lemma}) ${lemmaGloss}` : own;
}

async function glossLookup(w: string): Promise<string | null> {
  const hit = await exact("gloss", w);
  if (hit) return resolve(hit);
  const el = w.match(ELIDED_RE);
  if (el) return glossLookup(el[2]);
  for (const alt of [w.replace(/s$/, ""), w.replace(/x$/, "")]) {
    if (alt !== w) {
      const a = await exact("gloss", alt);
      if (a) return resolve(a);
    }
  }
  return null;
}

/** Short English meaning of one French word from the Wiktionary dictionary, or null. */
export async function gloss(raw: string): Promise<string | null> {
  const w = cleanToken(raw);
  if (!w || /\s/.test(w)) return null;
  return glossLookup(w);
}

/** Cleans a machine translation of a single word: no trailing full stop, no stray quotes. */
export const tidyMeaning = (t: string) => t.trim().replace(/^["“«]+|["”»]+$/g, "").replace(/[.。]+$/, "").trim();
