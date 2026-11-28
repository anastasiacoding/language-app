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

const CSS = `
:root{--scarlet:#a4161a;--soft:#f6e3e1;--brass:#c39a4e;--bg:#f8f5f2;--card:#fff;--line:#e8e2dc;--text:#2b1d18;--muted:#6b5850;--on:#fff3e6}
*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--text);font-family:Montserrat,system-ui,-apple-system,sans-serif;line-height:1.55}
main{max-width:680px;margin:0 auto;padding:28px 22px 64px}
header{display:flex;align-items:center;gap:10px;margin-bottom:22px}header a{display:flex;align-items:center;gap:10px;color:var(--text);text-decoration:none;font-weight:700}
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
${opts.body}
<footer>French Lion is a free app to practice French: read texts aloud, translate and retell them, and drill grammar from A1 to B2. No ads. <a href="/">Open the app</a> · <a href="/grammar/">All grammar rules</a> · <a href="mailto:hello@frenchlion.app">hello@frenchlion.app</a></footer>
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
<p class="small" style="text-align:center">Endless exercises in the free French Lion app. No ads, works on iPhone, Android and computers.</p>
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

// Same order as in the app: by level, then category.
const ordered = LEVELS.flatMap((lv) => RULES.filter((r) => r.level === lv.id).sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)));

mkdirSync(join(OUT, "grammar"), { recursive: true });
writeFileSync(join(OUT, "grammar", "index.html"), hubPage());
ordered.forEach((r, i) => {
  mkdirSync(join(OUT, "grammar", r.id), { recursive: true });
  writeFileSync(join(OUT, "grammar", r.id, "index.html"), rulePage(r, ordered[i - 1], ordered[i + 1]));
});

const urls = [
  { loc: "/", freq: "weekly", pri: "1.0" },
  { loc: "/grammar/", freq: "monthly", pri: "0.9" },
  ...ordered.map((r) => ({ loc: `/grammar/${r.id}/`, freq: "monthly", pri: "0.7" })),
];
writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.freq}</changefreq><priority>${u.pri}</priority></url>`).join("\n")}
</urlset>
`);
console.log(`grammar pages: ${ordered.length} rules + hub, sitemap: ${urls.length} urls`);
