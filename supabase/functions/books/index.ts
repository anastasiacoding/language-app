// Edge function: search and fetch public-domain French books from
// Project Gutenberg and French Wikisource. (Gallica blocks server requests, so the app links to it instead.)
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { action, source, q = "", id = "" } = await req.json();
    const query = String(q).slice(0, 120);
    const key = String(id).slice(0, 300);
    if (action === "search") {
      if (source === "gutenberg") return json({ results: await gutenbergSearch(query) });
      if (source === "wikisource") return json({ results: await wikisourceSearch(query) });
    }
    if (action === "open") {
      if (source === "gutenberg") return json(await gutenbergOpen(key));
      if (source === "wikisource") return json(await wikisourceOpen(key));
    }
    return json({ error: "Unknown request" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Something went wrong" }, 502);
  }
});
