// Text comparison helpers used to score reading, translation and retelling.

export function normalize(s: string): string {
  return s
    .normalize("NFC")
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae");
}

/** Splits into word tokens; "l'homme" -> ["l", "homme"]. Keeps accents. */
export function tokenize(s: string): string[] {
  return normalize(s)
    .replace(/[^\p{L}\p{N}'\- ]+/gu, " ")
    .replace(/'/g, " ")
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function stripAccents(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = new Array(n + 1).fill(0).map((_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

export function similar(a: string, b: string, threshold = 0.8): boolean {
  if (a === b) return true;
  const A = stripAccents(a), B = stripAccents(b);
  if (A === B) return true;
  const d = levenshtein(A, B);
  return 1 - d / Math.max(A.length, B.length) >= threshold;
}

export interface WordResult {
  word: string; // original display word (from the text)
  token: string; // normalized
  ok: boolean;
}

/**
 * Aligns the expected tokens with what was recognized (longest common subsequence
 * with fuzzy matching) and marks each expected word as read correctly or not.
 */
export function scoreReading(expectedText: string, heard: string): { words: WordResult[]; score: number } {
  const exp = tokenize(expectedText);
  const got = tokenize(heard);
  const m = exp.length, n = got.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = similar(exp[i], got[j]) ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ok = new Array(m).fill(false);
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (similar(exp[i], got[j])) {
      ok[i] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  const words = exp.map((t, k) => ({ word: t, token: t, ok: ok[k] }));
  const score = m ? Math.round((ok.filter(Boolean).length / m) * 100) : 0;
  return { words, score };
}

const EN_STOP = new Set(
  "a an the of to in on at for from by with and or but is are was were be been it its this that these those he she they we you i his her their our your my me him them us as so not no do did does has have had will would can could there here then than very just also into out up down over about".split(" "),
);
export const FR_STOP = new Set(
  "le la les l un une des de du d et ou mais à a au aux en dans sur sous par pour avec sans ce cet cette ces se s il elle ils elles on nous vous je j tu me m te t lui leur leurs son sa ses mon ma mes ton ta tes notre nos votre vos qui que qu quoi dont où ne n pas plus est sont était été être avoir a ont avait y comme si tout tous toute toutes très bien aussi alors puis".split(" "),
);

function stemEn(w: string) {
  return w.replace(/(ing|ed|es|s)$/, "");
}

/** Approximate meaning overlap between the user's English translation and a reference. */
export function scoreTranslation(reference: string, user: string): { score: number; missed: string[] } {
  const ref = tokenize(reference).filter((w) => !EN_STOP.has(w));
  const usr = tokenize(user).filter((w) => !EN_STOP.has(w));
  if (!ref.length) return { score: 0, missed: [] };
  const usrStems = usr.map(stemEn);
  const refStems = ref.map(stemEn);
  const hit = refStems.map((r) => usrStems.some((u) => similar(r, u, 0.75)));
  const recall = hit.filter(Boolean).length / ref.length;
  const precision = usr.length ? usrStems.filter((u) => refStems.some((r) => similar(r, u, 0.75))).length / usr.length : 0;
  const f1 = recall + precision ? (2 * recall * precision) / (recall + precision) : 0;
  const missed = Array.from(new Set(ref.filter((_, k) => !hit[k])));
  return { score: Math.round(Math.min(1, f1 * 1.05) * 100), missed };
}

/** Light French stemmer: enough to match "partit" with "parti", "navires" with "navire". */
export function stemFr(w: string): string {
  let s = stripAccents(w.toLowerCase());
  for (const suf of ["issements", "issement", "ations", "ation", "ements", "ement", "ments", "ment", "euses", "euse", "eurs", "eur", "ives", "ive", "aient", "ions", "iez", "ais", "ait", "ant", "ent", "ons", "ez", "er", "ir", "re", "ee", "es", "e", "s", "x", "t"]) {
    if (s.endsWith(suf) && s.length - suf.length >= 3) {
      s = s.slice(0, -suf.length);
      break;
    }
  }
  return s;
}

/** The words we suggest using in a retelling: nouns and names from the passage, in text order. */
export function retellKeywords(passage: string, n = 5): string[] {
  const text = normalize(passage);
  const nouns: string[] = [];
  const re = /(?:^|[\s(«"])(?:le|la|les|l'|un|une|des|du|au|aux|son|sa|ses|ce|cette|mon|ma|notre|leur)\s*([a-zàâäçéèêëîïôöùûüœ\-]{3,})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const w = m[1].replace(/-$/, "");
    if (!FR_STOP.has(w) && !nouns.includes(w)) nouns.push(w);
  }
  if (nouns.length < n) {
    for (const w of tokenize(passage)) if (!FR_STOP.has(w) && w.length > 4 && !nouns.includes(w)) nouns.push(w);
  }
  // spread the picks across the passage, favouring longer words
  if (nouns.length <= n) return nouns.slice(0, n);
  const step = nouns.length / n;
  return Array.from({ length: n }, (_, i) => {
    const slice = nouns.slice(Math.floor(i * step), Math.floor((i + 1) * step));
    return slice.sort((a, b) => b.length - a.length)[0];
  });
}

export interface GrammarIssue {
  message: string;
  text: string;
  fix: string[];
}

export interface RetellResult {
  score: number;
  keywordsUsed: string[];
  keywordsMissed: string[];
  meaning: number; // 0..100
  grammar: number | null; // 0..100, null if the check failed
  issues: GrammarIssue[];
}

/**
 * Retelling score out of 100:
 * 35% suggested words used, 35% meaning (shared content with the passage, by word stems),
 * 30% grammar (LanguageTool issues per 10 words). Unrelated talk is capped at 15%.
 */
export function scoreRetelling(passage: string, retell: string, suggested: string[], issues: GrammarIssue[] | null): RetellResult {
  const saidAll = tokenize(retell);
  const said = saidAll.filter((w) => !FR_STOP.has(w) && w.length > 2);
  const saidStems = new Set(said.map(stemFr));
  const used = suggested.filter((k) => k.split(/[-' ]/).filter((p) => p.length > 2).every((p) => saidStems.has(stemFr(p))) || said.some((s) => s.length > 5 && similar(s, k, 0.86)));
  const kw = suggested.length ? used.length / suggested.length : 0;

  const key = Array.from(new Set(tokenize(passage).filter((w) => !FR_STOP.has(w) && w.length > 3).map(stemFr)));
  const recall = key.length ? key.filter((k) => saidStems.has(k)).length / Math.max(4, Math.round(key.length * 0.4)) : 0;
  const precision = said.length ? said.filter((s) => key.includes(stemFr(s))).length / said.length : 0;
  const meaning = Math.min(1, recall) * (0.4 + 0.6 * Math.min(1, precision * 2));

  let grammar: number | null = null;
  if (issues) {
    const per10 = issues.length / Math.max(1, saidAll.length / 10);
    grammar = Math.max(0, 1 - per10 * 0.35);
  }
  const length = Math.min(1, saidAll.length / 15);
  let total = (0.35 * kw + 0.35 * meaning + 0.3 * (grammar ?? meaning)) * length;
  if (meaning < 0.15) total = Math.min(total, 0.1);
  return {
    score: Math.round(total * 100),
    keywordsUsed: used,
    keywordsMissed: suggested.filter((k) => !used.includes(k)),
    meaning: Math.round(meaning * 100),
    grammar: grammar == null ? null : Math.round(grammar * 100),
    issues: issues ?? [],
  };
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?…»])\s+(?=[«A-ZÀ-ÖØ-Þ"—–-])/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Groups sentences into passages of about 80 words or 6 sentences. */
export function splitPassages(text: string): string[] {
  const out: string[] = [];
  let cur: string[] = [];
  let words = 0;
  for (const s of splitSentences(text)) {
    cur.push(s);
    words += s.split(/\s+/).length;
    if (words >= 80 || cur.length >= 6) {
      out.push(cur.join(" "));
      cur = [];
      words = 0;
    }
  }
  if (cur.length) out.push(cur.join(" "));
  return out;
}
