// Builds open, indexable HTML pages for every grammar rule into dist/grammar/,
// plus dist/sitemap.xml. Run after `vite build`:
//   node --experimental-strip-types scripts/build-grammar-pages.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RULES, LEVELS, CATEGORY_ORDER, type Rule, type Level } from "../src/data/rules.ts";

const SITE = "https://frenchlion.app";
const OUT = "dist";
const today = new Date().toISOString().slice(0, 10);

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const clip = (s: string, n: number) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(" ", n - 1)) + "…");
const levelName = (l: Level) => LEVELS.find((x) => x.id === l)!.name;

const MENU: [string, string][] = [["/grammar/", "Grammar A1–B2"], ["/read-french-aloud/", "Read aloud"], ["/free-french-books/", "Free books"], ["/", "Open the app"]];

const CSS = `
:root{--scarlet:#a4161a;--soft:#f6e3e1;--brass:#c39a4e;--bg:#f8f5f2;--card:#fff;--line:#e8e2dc;--text:#2b1d18;--muted:#6b5850;--on:#fff3e6}
*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--text);font-family:Montserrat,system-ui,-apple-system,sans-serif;line-height:1.55}
main{max-width:680px;margin:0 auto;padding:28px 22px 64px}
header{display:flex;align-items:center;gap:10px;margin-bottom:12px}
nav.menu{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}nav.menu a{font-size:14px;font-weight:600;text-decoration:none;color:var(--text);background:var(--card);border:1px solid var(--line);padding:6px 12px;border-radius:99px}nav.menu a[aria-current]{background:var(--scarlet);border-color:var(--scarlet);color:var(--on)}header a{display:flex;align-items:center;gap:10px;color:var(--text);text-decoration:none;font-weight:700}
header img{width:36px;height:36px}
nav.crumbs{font-size:14px;color:var(--muted);margin-bottom:6px}nav.crumbs a{color:var(--muted)}
h1{font-size:30px;line-height:1.2;margin:4px 0 8px}h2{font-size:20px;margin:28px 0 10px}
.tag{display:inline-block;font-size:13px;font-weight:600;padding:3px 10px;border-radius:99px;background:var(--soft);color:var(--scarlet);margin-right:6px}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px 18px;margin:12px 0}
table{width:100%;border-collapse:collapse}td{padding:8px 6px;border-bottom:1px solid var(--line);vertical-align:top}tr:last-child td{border-bottom:0}
td:first-child{color:var(--muted);width:42%}tr.hl td:last-child{color:var(--scarlet);font-weight:600}
.ex{margin:0 0 12px}.ex:last-child{margin:0}.ex .fr{font-weight:600}.ex .en{color:var(--muted)}
.cta{display:block;text-align:center;background:var(--scarlet);color:var(--on);text-decoration:none;font-weight:700;padding:15px 18px;border-radius:16px;margin:28px 0 8px}
.small{font-size:14px;color:var(--muted)}a{color:var(--scarlet)}
.pager{display:flex;justify-content:space-between;gap:12px;margin-top:28px;font-size:15px}
ul.rules{list-style:none;padding:0;margin:0}ul.rules li{padding:10px 0;border-bottom:1px solid var(--line)}ul.rules li:last-child{border:0}
ul.rules a{font-weight:600;text-decoration:none}ul.rules span{color:var(--muted);font-size:14px;margin-left:6px}
footer{margin-top:40px;font-size:13px;color:var(--muted)}
ol.steps{margin:0;padding-left:22px}ol.steps li{padding:8px 0}ul.plain{margin:0;padding-left:18px}ul.plain li{padding:6px 0}
`;

function page(opts: { path: string; title: string; description: string; body: string; jsonld: object[] }) {
  const url = SITE + opts.path;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}" />
<link rel="canonical" href="${url}" />
<link rel="icon" href="/favicon-32.png" sizes="32x32" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="theme-color" content="#A4161A" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="French Lion" />
<meta property="og:title" content="${esc(opts.title)}" />
<meta property="og:description" content="${esc(opts.description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${SITE}/icon-512.png" />
${opts.jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n")}
<style>${CSS}</style>
</head>
<body>
<main>
<header><a href="/"><img src="/icon.svg" alt="" />French Lion</a></header>
<nav class="menu" aria-label="Main">${MENU.map(([href, label]) => `<a href="${href}"${opts.path.startsWith(href) && href !== "/" ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>
${opts.body}
<footer>French Lion is a free app to practice French: read texts aloud, translate and retell them, and drill grammar from A1 to B2. No ads. <a href="/">Open the app</a> · <a href="/read-french-aloud/">Read aloud</a> · <a href="/free-french-books/">Free books</a> · <a href="/grammar/">Grammar rules</a> · <a href="mailto:hello@frenchlion.app">hello@frenchlion.app</a></footer>
</main>
</body>
</html>
`;
}

function rulePage(r: Rule, prev?: Rule, next?: Rule) {
  const path = `/grammar/${r.id}/`;
  const title = `${r.title} in French (${r.short}): rule, examples and exercises · ${r.level}`;
  const description = clip(`${r.level} French grammar: ${r.title.toLowerCase()} (${r.short}). ${r.explain[0]}`, 158);
  const table = r.table
    ? `<h2>At a glance</h2><div class="card"><table>${r.table.map(([a, b, hl]) => `<tr${hl ? ' class="hl"' : ""}><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join("")}</table></div>`
    : "";
  const body = `
<nav class="crumbs"><a href="/grammar/">French grammar</a> › ${r.level} ${esc(levelName(r.level))}</nav>
<h1>${esc(r.title)} <span style="color:var(--muted);font-weight:500">· ${esc(r.short)}</span></h1>
<p><span class="tag">${r.level}</span><span class="tag">${esc(r.category)}</span></p>
<h2>The rule</h2>
${r.explain.map((p) => `<p>${esc(p)}</p>`).join("\n")}
${table}
<h2>Examples</h2>
<div class="card">${r.examples.map(([fr, en]) => `<p class="ex" lang="fr"><span class="fr">${esc(fr)}</span><br /><span class="en" lang="en">${esc(en)}</span></p>`).join("")}</div>
<a class="cta" href="/#/grammar/${r.id}">Practice ${esc(r.title.toLowerCase())} with free exercises</a>
<p class="small" style="text-align:center">Endless exercises in the French Lion app. You need a free account: no ads, no subscription. Works on iPhone, Android and computers.</p>
<div class="pager"><span>${prev ? `← <a href="/grammar/${prev.id}/">${esc(prev.title)}</a>` : ""}</span><span>${next ? `<a href="/grammar/${next.id}/">${esc(next.title)}</a> →` : ""}</span></div>`;
  const jsonld = [
    {
      "@context": "https://schema.org", "@type": "LearningResource", name: `${r.title} in French`, description,
      url: SITE + path, inLanguage: "en", educationalLevel: `CEFR ${r.level}`, learningResourceType: "Grammar rule with examples and exercises",
      teaches: `French grammar: ${r.title}`, isAccessibleForFree: true,
      provider: { "@type": "Organization", name: "French Lion", url: SITE + "/" },
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "French grammar", item: SITE + "/grammar/" },
        { "@type": "ListItem", position: 2, name: r.title, item: SITE + path },
      ],
    },
  ];
  return page({ path, title, description, body, jsonld });
}

function hubPage() {
  const sections = LEVELS.map((lv) => {
    const rules = RULES.filter((r) => r.level === lv.id).sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
    return `<h2>${lv.id} · ${esc(lv.name)}</h2><div class="card"><ul class="rules">${rules.map((r) => `<li><a href="/grammar/${r.id}/">${esc(r.title)}</a><span>${esc(r.short)}</span></li>`).join("")}</ul></div>`;
  }).join("\n");
  const body = `
<h1>French grammar from A1 to B2</h1>
<p>${RULES.length} French grammar rules explained in plain English, each with a summary table and examples: articles, passé composé and imparfait, the subjunctive, pronouns, si clauses and more. Practice every rule with endless free exercises in the French Lion app.</p>
${sections}
<a class="cta" href="/">Practice French grammar for free</a>`;
  return page({
    path: "/grammar/",
    title: `French grammar A1–B2: ${RULES.length} rules with examples and free exercises · French Lion`,
    description: `${RULES.length} French grammar rules from A1 to B2 explained in plain English with tables and examples: articles, passé composé, imparfait, subjonctif, pronouns, si clauses. Free exercises.`,
    body,
    jsonld: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: "French grammar from A1 to B2", url: SITE + "/grammar/" }],
  });
}

// ───────── Feature pages ─────────
const SIGNUP = `<a class="cta" href="/#/signup">Create a free account</a>
<p class="small" style="text-align:center">Free, no ads, no subscription. An account keeps your texts, words and progress in sync. Already have one? <a href="/">Log in</a></p>`;

const steps = (items: [string, string][]) =>
  `<div class="card"><ol class="steps">${items.map(([h, p]) => `<li><b>${h}</b><br />${p}</li>`).join("")}</ol></div>`;

function readAloudPage() {
  const path = "/read-french-aloud/";
  const title = "Practice French pronunciation by reading aloud, with a score and IPA · French Lion";
  const description = "Read any French text out loud and see which words came out right. Tap a word for its IPA, then translate and retell the text by voice. Free app, no ads.";
  const body = `
<nav class="crumbs"><a href="/">French Lion</a> › Read aloud</nav>
<h1>Practice French pronunciation by reading aloud</h1>
<p>Reading out loud is one of the simplest ways to train your mouth and your ear at the same time. French Lion listens while you read a French text and shows you which words came through clearly and which ones need another try.</p>
<h2>How it works</h2>
${steps([
    ["Pick a text", "Choose a free classic from Wikisource, or add your own: a photo of a book page, a screenshot, a link to an article or plain pasted text."],
    ["Read it out loud", "The text is split into short passages. Tap the mic and read. You get a reading accuracy score, and the words that weren’t recognised are highlighted."],
    ["Check the sound of a word", "Tap any word to see its pronunciation in IPA and its meaning in English, then save it to your words."],
    ["Translate and retell", "Say the translation in English, then retell the passage in your own French words. The retelling is checked for meaning, key words and grammar."],
    ["Review your words", "Saved words come back in short reviews, with their IPA, so they stick."],
  ])}
<h2>Good to know</h2>
<ul>
<li>The score comes from your device’s speech recognition, which turns your speech into text. It’s a practical guide, not a phonetics exam. Recordings are never stored.</li>
<li>Works in Safari and Chrome on iPhone, Android and computers. Use a quiet room and hold the phone close.</li>
<li>Photos of book pages are recognised on your device and never uploaded.</li>
</ul>
<h2>What else is inside</h2>
<p><a href="/grammar/">63 grammar rules from A1 to B2</a> with endless exercises, a noun gender checker (le or la for 17,000 nouns), every verb in every tense, and a daily streak with your lion.</p>
${SIGNUP}`;
  return page({
    path, title, description, body,
    jsonld: [{
      "@context": "https://schema.org", "@type": "WebPage", name: "Practice French pronunciation by reading aloud", url: SITE + path, description,
      about: { "@type": "WebApplication", name: "French Lion", url: SITE + "/", applicationCategory: "EducationalApplication", operatingSystem: "Web, iOS, Android", offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" } },
    }],
  });
}

function freeBooksPage() {
  const path = "/free-french-books/";
  const title = "Free French books to read aloud: public-domain classics from Wikisource · French Lion";
  const description = "Read free public-domain French books out loud: Hugo, Dumas, Maupassant, Verne, La Fontaine and more from Wikisource, split into short passages for practice.";
  const body = `
<nav class="crumbs"><a href="/">French Lion</a> › Free books</nav>
<h1>Free French books to read aloud</h1>
<p>Every text in French Lion’s library comes from open sources: books whose copyright has expired and that anyone can read, share and learn from. You search the library inside the app, pick a book, and it is split into chapters and short passages that you read out loud.</p>
<h2>Where the texts come from</h2>
<div class="card"><ul class="plain">
<li><b><a href="https://fr.wikisource.org" rel="noopener">Wikisource</a></b> · the free library of the Wikimedia community, with tens of thousands of French texts in the public domain. Available now.</li>
<li><b><a href="https://www.gutenberg.org" rel="noopener">Project Gutenberg</a></b> · one of the oldest free e-book libraries. Connected when its site is online.</li>
<li><b><a href="https://gallica.bnf.fr" rel="noopener">Gallica</a></b> · the digital library of the Bibliothèque nationale de France. Coming soon; for now, take screenshots of its pages and add them as photos.</li>
</ul></div>
<h2>Ideas to start with</h2>
<ul>
<li><b>Short and gentle:</b> fables by Jean de La Fontaine, fairy tales by Charles Perrault.</li>
<li><b>Short stories:</b> Guy de Maupassant, Alphonse Daudet’s <i lang="fr">Lettres de mon moulin</i>.</li>
<li><b>Adventure:</b> Jules Verne, Alexandre Dumas.</li>
<li><b>The big classics:</b> Victor Hugo, Émile Zola, Gustave Flaubert.</li>
</ul>
<p>Prefer something modern? Add your own text: a photo of a page from a book you own, a screenshot, a link to an article, or pasted text. Your texts stay private to your account.</p>
<h2>Then practice with it</h2>
<p>Read each passage out loud and get a score, tap any word for its <a href="/read-french-aloud/">pronunciation in IPA</a> and meaning, translate and retell it by voice, and drill the <a href="/grammar/">grammar</a> you meet along the way.</p>
${SIGNUP}`;
  return page({
    path, title, description, body,
    jsonld: [{ "@context": "https://schema.org", "@type": "WebPage", name: "Free French books to read aloud", url: SITE + path, description, isAccessibleForFree: true }],
  });
}

// Same order as in the app: by level, then category.
const ordered = LEVELS.flatMap((lv) => RULES.filter((r) => r.level === lv.id).sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)));

mkdirSync(join(OUT, "grammar"), { recursive: true });
writeFileSync(join(OUT, "grammar", "index.html"), hubPage());
ordered.forEach((r, i) => {
  mkdirSync(join(OUT, "grammar", r.id), { recursive: true });
  writeFileSync(join(OUT, "grammar", r.id, "index.html"), rulePage(r, ordered[i - 1], ordered[i + 1]));
});

for (const [dir, html] of [["read-french-aloud", readAloudPage()], ["free-french-books", freeBooksPage()]]) {
  mkdirSync(join(OUT, dir), { recursive: true });
  writeFileSync(join(OUT, dir, "index.html"), html);
}

const urls = [
  { loc: "/", freq: "weekly", pri: "1.0" },
  { loc: "/read-french-aloud/", freq: "monthly", pri: "0.9" },
  { loc: "/free-french-books/", freq: "monthly", pri: "0.9" },
  { loc: "/grammar/", freq: "monthly", pri: "0.9" },
  ...ordered.map((r) => ({ loc: `/grammar/${r.id}/`, freq: "monthly", pri: "0.7" })),
];
writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.freq}</changefreq><priority>${u.pri}</priority></url>`).join("\n")}
</urlset>
`);
console.log(`grammar pages: ${ordered.length} rules + hub, sitemap: ${urls.length} urls`);
