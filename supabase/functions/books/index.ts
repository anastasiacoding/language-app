// Edge function: search and fetch public-domain French books from
// Project Gutenberg and French Wikisource, extract text from open web pages,
// and check French grammar with LanguageTool.
// (Gallica blocks server requests, so the app asks for screenshots instead.)
// Runs server-side so the app avoids cross-site limits and the user's IP isn't sent to these sites.
// Requires a signed-in user (verify_jwt), so it can't be used as an open proxy.
import { DOMParser } from "npm:linkedom@0.18.5";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const UA = { "User-Agent": "LanguageAppAP/0.1 (French learning app; non-commercial)" };
const MAX = 1_500_000;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function get(url: string, timeoutMs = 20000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: UA, signal: ctrl.signal });
    if (!r.ok) throw new Error(`Source answered ${r.status}`);
    const txt = await r.text();
    return txt.slice(0, MAX * 2);
  } finally {
    clearTimeout(t);
  }
}

const clean = (s: string) => s.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

// ---------- Gutenberg ----------
async function gutendexSearch(q: string) {
  const url = `https://gutendex.com/books/?languages=fr${q ? `&search=${encodeURIComponent(q)}` : ""}`;
  const data = JSON.parse(await get(url, 12000));
  return (data.results ?? [])
    .filter((b: any) => Object.keys(b.formats ?? {}).some((f) => f.startsWith("text/plain")))
    .filter((b: any) => {
      const d = b.authors?.[0]?.death_year;
      return d == null || d <= 1955; // public domain in France: author died more than 70 years ago
    })
    .slice(0, 25)
    .map((b: any) => ({
      id: String(b.id),
      title: b.title,
      author: (b.authors?.[0]?.name ?? "").replace(/^(.+?), (.+)$/, "$2 $1"),
      year: b.authors?.[0]?.death_year ? `†${b.authors[0].death_year}` : "",
    }));
}

async function opdsSearch(q: string) {
  const query = `${q || "roman"} l.fr`;
  const xml = await get(`https://www.gutenberg.org/ebooks/search.opds/?sort_order=downloads&query=${encodeURIComponent(query)}`, 15000);
  return xml
    .split(/<entry>/)
    .slice(1)
    .map((e) => {
      const id = e.match(/\/ebooks\/(\d+)/)?.[1] ?? "";
      const title = (e.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "").trim();
      const author = (e.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] ?? "").replace(/<[^>]+>/g, "").trim();
      return { id, title, author, year: "" };
    })
    .filter((r) => r.id && r.title)
    .slice(0, 25);
}

async function gutenbergSearch(q: string) {
  try {
    const r = await gutendexSearch(q);
    if (r.length) return r;
  } catch {
    /* fall back to the official catalogue */
  }
  try {
    return await opdsSearch(q);
  } catch {
    throw new Error("Project Gutenberg isn’t answering right now. Try again later or use Wikisource.");
  }
}

async function gutenbergOpen(id: string) {
  if (!/^\d+$/.test(id)) throw new Error("Bad id");
  const digits = id.length > 1 ? id.slice(0, -1).split("").join("/") : "0";
  const urls = [
    `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
    `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
    `https://aleph.gutenberg.org/${digits}/${id}/${id}-0.txt`,
    `https://aleph.gutenberg.org/${digits}/${id}/${id}.txt`,
  ];
  let txt = "";
  for (const u of urls) {
    try {
      txt = await get(u, 15000);
      if (txt.length > 500 && !/Temporarily Down for Maintenance/i.test(txt)) break;
      txt = "";
    } catch {
      /* try the next mirror */
    }
  }
  if (!txt) throw new Error("Project Gutenberg isn’t answering right now. Try again later or use Wikisource.");
  const start = txt.search(/\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG.*\*\*\*/i);
  const end = txt.search(/\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG/i);
  let body = txt.slice(start >= 0 ? txt.indexOf("\n", start) + 1 : 0, end > 0 ? end : undefined);
  // unwrap hard line breaks inside paragraphs
  body = body.replace(/\r/g, "").replace(/([^\n])\n(?!\n)/g, "$1 ");
  return { kind: "text", text: clean(body).slice(0, MAX) };
}

// ---------- Language check ----------
const FR = new Set("le la les un une des de du et à au aux en dans sur pour avec par que qui ne pas il elle ils elles nous vous je est sont était son sa ses ce cette mais ou se plus comme tout".split(" "));
const EN = new Set("the and of to in that is was he she it with for as his her on by at from this which be not are".split(" "));
function looksFrench(text: string) {
  const words = text.toLowerCase().replace(/[^a-zàâäçéèêëîïôöùûüœ' ]+/g, " ").split(/[\s']+/).filter(Boolean);
  if (words.length < 6) return true;
  const fr = words.filter((w) => FR.has(w)).length;
  const en = words.filter((w) => EN.has(w)).length;
  return fr / words.length >= 0.12 && fr > en;
}

// ---------- Wikisource ----------
const WS = "https://fr.wikisource.org/w/api.php";

async function wikisourceSearch(q: string) {
  if (!q) {
    q = "roman";
  }
  const url = `${WS}?action=query&list=search&format=json&srnamespace=0&srlimit=30&srsearch=${encodeURIComponent(q)}`;
  const data = JSON.parse(await get(url));
  const seen = new Set<string>();
  const out: any[] = [];
  for (const r of data.query?.search ?? []) {
    const snippet = String(r.snippet ?? "").replace(/<[^>]+>/g, " ");
    if (!looksFrench(snippet)) continue;
    const top = r.title.split("/")[0];
    if (seen.has(top)) continue;
    seen.add(top);
    out.push({ id: top, title: top, author: "", year: "" });
  }
  return out.slice(0, 20);
}

function wsText(doc: any) {
  doc.querySelectorAll(".ws-noexport, .reference, .references, .mw-editsection, table, style, sup, .noprint, #headertemplate, .headertemplate, .ws-summary").forEach((n: any) => n.remove());
  return Array.from(doc.querySelectorAll("p, .poem"))
    .map((p: any) => (p.textContent ?? "").replace(/\s+/g, " ").trim())
    .filter((t: string) => t.length > 30)
    .join("\n\n");
}

async function wikisourceOpen(title: string) {
  const url = `${WS}?action=parse&format=json&prop=text&redirects=1&page=${encodeURIComponent(title)}`;
  const data = JSON.parse(await get(url));
  if (data.error) throw new Error("Page not found on Wikisource");
  const realTitle: string = data.parse.title;
  const doc = new DOMParser().parseFromString(`<html><body>${data.parse.text["*"]}</body></html>`, "text/html");
  const prefix = "/wiki/" + realTitle.replace(/ /g, "_") + "/";
  const chapters: { id: string; title: string }[] = [];
  const seen = new Set<string>();
  for (const a of Array.from(doc.querySelectorAll("a")) as any[]) {
    const href = decodeURIComponent(a.getAttribute("href") ?? "");
    if (!href.startsWith(prefix)) continue;
    const sub = href.slice(6).split("#")[0].replace(/_/g, " ");
    if (seen.has(sub)) continue;
    seen.add(sub);
    const label = (a.textContent ?? "").replace(/\s+/g, " ").trim() || sub.split("/").pop();
    chapters.push({ id: sub, title: label });
  }
  if (chapters.length >= 2) return { kind: "chapters", title: realTitle, chapters: chapters.slice(0, 300) };
  const text = wsText(doc);
  if (text.length < 50) throw new Error("No readable text on that page");
  return { kind: "text", title: realTitle.replace(/\//g, " · "), text: text.slice(0, MAX) };
}

// ---------- Any open web page (article or book chapter) ----------
function safeUrl(raw: string): URL {
  const u = new URL(raw);
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("Only web links work.");
  const h = u.hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".supabase.co") || /^(\d+\.){3}\d+$/.test(h) || h.includes(":") || !h.includes(".")) throw new Error("This link can’t be opened.");
  if (/(^|\.)gallica\.bnf\.fr$/.test(h)) throw new Error("Gallica blocks apps from loading its books. Take screenshots of the pages instead and add them with Photo or screenshot.");
  return u;
}

async function fromUrl(raw: string) {
  const u = safeUrl(raw);
  if (/(^|\.)wikisource\.org$/.test(u.hostname)) {
    const m = u.pathname.match(/\/wiki\/(.+)$/);
    if (m) return wikisourceOpen(decodeURIComponent(m[1]).replace(/_/g, " "));
  }
  if (/(^|\.)gutenberg\.org$/.test(u.hostname)) {
    const id = u.pathname.match(/\/(?:ebooks|files|epub)\/(\d+)/)?.[1];
    if (id) return { ...(await gutenbergOpen(id)), title: "" };
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  let html = "";
  try {
    const r = await fetch(u.toString(), { headers: { ...UA, Accept: "text/html,text/plain" }, signal: ctrl.signal, redirect: "follow" });
    if (!r.ok) throw new Error(r.status === 403 ? "This site blocks apps. Copy the text and use Paste text." : `The site answered ${r.status}.`);
    const type = r.headers.get("content-type") ?? "";
    if (!/text\/(html|plain)|xhtml/.test(type)) throw new Error("This link isn’t a web page with text.");
    html = (await r.text()).slice(0, 3_000_000);
    if (type.includes("text/plain")) return { kind: "text", title: "", text: clean(html.replace(/([^\n])\n(?!\n)/g, "$1 ")).slice(0, MAX) };
  } finally {
    clearTimeout(t);
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  const title = (doc.querySelector('meta[property="og:title"]')?.getAttribute("content") || doc.querySelector("title")?.textContent || "").trim();
  doc.querySelectorAll("script, style, noscript, nav, header, footer, aside, form, figure, iframe, button, .comments, #comments, .share, .newsletter, .advert, .ad").forEach((n: any) => n.remove());
  const root = doc.querySelector("article") ?? doc.querySelector("main") ?? doc.querySelector("body");
  const paras = Array.from(root?.querySelectorAll("p, blockquote") ?? [])
    .map((p: any) => (p.textContent ?? "").replace(/\s+/g, " ").trim())
    .filter((t: string) => t.length > 40);
  const text = paras.join("\n\n");
  if (text.length < 200) throw new Error("No article text found on that page. Copy the text and use Paste text.");
  if (!looksFrench(text.slice(0, 2000))) throw new Error("This page doesn’t seem to be in French.");
  return { kind: "text", title: title.slice(0, 200), text: text.slice(0, MAX) };
}

// ---------- Grammar check (LanguageTool, Germany) ----------
// Speech-to-text has no punctuation or capitals, so only real grammar issues are kept.
const IGNORE = new Set(["PUNCTUATION", "TYPOGRAPHY", "CASING", "STYLE", "WHITESPACE", "REDUNDANCY", "TYPOS", "MISC"]);
async function grammar(text: string) {
  const body = new URLSearchParams({ text: text.slice(0, 5000), language: "fr" });
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch("https://api.languagetool.org/v2/check", { method: "POST", body, headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, signal: ctrl.signal });
    if (!r.ok) throw new Error("Grammar check is busy. Try again in a minute.");
    const data = await r.json();
    const issues = (data.matches ?? [])
      .filter((m: any) => !IGNORE.has(m.rule?.category?.id))
      .filter((m: any) => !/majuscule|ponctuation|espace|virgule|point/i.test(m.message ?? ""))
      .slice(0, 12)
      .map((m: any) => ({
        message: m.shortMessage || m.message,
        text: text.substr(m.offset, m.length),
        offset: m.offset,
        length: m.length,
        fix: (m.replacements ?? []).slice(0, 2).map((x: any) => x.value),
        category: m.rule?.category?.id ?? "",
      }));
    return { issues };
  } finally {
    clearTimeout(t);
  }
}

async function status() {
  const ok = async (u: string) => {
    try {
      const txt = await get(u, 6000);
      return txt.length > 200 && !/Temporarily Down for Maintenance/i.test(txt);
    } catch {
      return false;
    }
  };
  return { gutenberg: (await ok("https://www.gutenberg.org/ebooks/search.opds/?query=hugo%20l.fr")) || (await ok("https://gutendex.com/books/?ids=17489")) };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { action, source, q = "", id = "" } = await req.json();
    const query = String(q).slice(0, action === "grammar" ? 5000 : 120);
    const key = String(id).slice(0, 300);
    if (action === "search") {
      if (source === "gutenberg") return json({ results: await gutenbergSearch(query) });
      if (source === "wikisource") return json({ results: await wikisourceSearch(query) });
    }
    if (action === "open") {
      if (source === "gutenberg") return json(await gutenbergOpen(key));
      if (source === "wikisource") return json(await wikisourceOpen(key));
    }
    if (action === "url") return json(await fromUrl(String(id).slice(0, 2000)));
    if (action === "grammar") return json(await grammar(String(q || id)));
    if (action === "status") return json(await status());
    return json({ error: "Unknown request" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Something went wrong" }, 502);
  }
});
