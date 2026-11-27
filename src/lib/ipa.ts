// IPA transcriptions from open-dict-data/ipa-dict (fr_FR, MIT licence), split by first letter in public/ipa/.
// Files are fetched only when needed and cached by the browser.

const shards = new Map<string, Promise<Record<string, string>>>();

function shardKey(w: string) {
  const c = w[0].toLowerCase().replace("œ", "o").replace("æ", "a").normalize("NFD")[0];
  return c >= "a" && c <= "z" ? c : "_";
}

function shard(k: string) {
  let p = shards.get(k);
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}ipa/${k}.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
    shards.set(k, p);
    p.then((d) => Object.keys(d).length === 0 && shards.delete(k)); // retry later if it failed
  }
  return p;
}

async function exact(w: string): Promise<string | null> {
  if (!w) return null;
  const d = await shard(shardKey(w));
  return d[w] ?? null;
}

// Elided words before an apostrophe: l’homme = l + homme
const ELIDED: Record<string, string> = { l: "l", d: "d", j: "ʒ", m: "m", t: "t", s: "s", n: "n", c: "s", qu: "k", jusqu: "ʒysk", lorsqu: "lɔʁsk", puisqu: "pɥisk" };

/** Lower-cased word without surrounding punctuation, with straight apostrophes turned curly. */
export function cleanToken(raw: string) {
  return raw
    .toLowerCase()
    .replace(/'/g, "’")
    .replace(/^[«"“(\[—–\-…]+|[»"”)\].,;:!?…]+$/g, "")
    .trim();
}

async function lookup(w: string): Promise<string | null> {
  const hit = await exact(w);
  if (hit) return hit;
  // l’homme, qu’il …
  const el = w.match(/^(jusqu|lorsqu|puisqu|qu|[ldjmtsnc])’(.+)$/);
  if (el) {
    const rest = await lookup(el[2]);
    return rest ? rest.split(", ").map((p) => ELIDED[el[1]] + p).join(", ") : null;
  }
  // peut-être, dit-il …
  if (w.includes("-")) {
    const parts = await Promise.all(w.split("-").filter(Boolean).map(lookup));
    if (parts.every(Boolean)) return parts.map((p) => p!.split(", ")[0]).join("‿");
  }
  // plurals and verb endings that aren’t pronounced
  for (const alt of [w.replace(/[sx]$/, ""), w.replace(/ent$/, "e"), w.replace(/es$/, "e")]) {
    if (alt !== w) {
      const a = await exact(alt);
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
    const parts = await Promise.all(words.map((x) => lookup(cleanToken(x))));
    if (!parts.every(Boolean)) return null;
    return "/" + parts.map((p) => p!.split(", ")[0]).join(" ") + "/";
  }
  const r = await lookup(w);
  return r ? r.split(", ").slice(0, 3).map((p) => `/${p}/`).join(" · ") : null;
}
