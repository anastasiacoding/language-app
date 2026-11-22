// Endless exercise generators for each grammar rule. Everything is built locally from word lists.
import { NOUNS, NOUN_MAP, elides, plural, type G } from "../data/nouns";
import { conjugate } from "./conjugate";

export interface Item {
  before: string;
  after: string;
  en?: string;
  options: string[];
  answer: string;
  explain: string;
}

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const shuffle = <T,>(a: T[]): T[] => a.map((x) => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map((x) => x[1]);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const gname = (g: G) => (g === "m" ? "masculine" : "feminine");
const en1 = (en: string) => en.split(",")[0].trim();
function enPlural(en: string) {
  const w = en1(en);
  if (!/^[a-z]+$/.test(w)) return w + " (plural)";
  if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + "ies";
  if (/(s|x|ch|sh)$/.test(w)) return w + "es";
  if (w === "child") return "children";
  if (w === "man") return "men";
  if (w === "woman") return "women";
  if (w === "foot") return "feet";
  return w + "s";
}

const COUNTABLE = NOUNS.filter((n) => !["argent", "temps", "eau", "lait", "vin", "sucre", "sel", "beurre", "riz", "farine", "ail", "santé", "liberté", "vérité", "beauté", "peur", "joie", "amour", "chance", "silence", "nature", "culture", "musique", "neige", "pluie", "herbe", "huile", "confiture", "viande", "soupe", "thé", "café", "fromage", "pain", "chocolat"].includes(n.fr));

function definite(): Item {
  const n = pick(COUNTABLE);
  const pl = Math.random() < 0.25;
  const word = pl ? plural(n) : n.fr;
  const answer = pl ? "les" : elides(n.fr) ? "l’" : n.g === "m" ? "le" : "la";
  return {
    before: "",
    after: (answer === "l’" ? "" : " ") + word,
    en: `the ${pl ? enPlural(n.en) : en1(n.en)}`,
    options: ["le", "la", "l’", "les"],
    answer,
    explain: pl ? "Plural nouns always take les." : answer === "l’" ? `${n.fr} starts with a vowel sound, so the article becomes l’ (${n.fr} is ${gname(n.g)}).` : `${n.fr} is ${gname(n.g)}, so it takes ${answer}.`,
  };
}

function indefinite(): Item {
  const n = pick(COUNTABLE);
  const pl = Math.random() < 0.3;
  const answer = pl ? "des" : n.g === "m" ? "un" : "une";
  const word = pl ? plural(n) : n.fr;
  return {
    before: "",
    after: " " + word,
    en: pl ? `some ${enPlural(n.en)}` : `${/^[aeiou]/.test(en1(n.en)) ? "an" : "a"} ${en1(n.en)}`,
    options: ["un", "une", "des"],
    answer,
    explain: pl ? "In the plural, un and une become des." : `${n.fr} is ${gname(n.g)}, so it takes ${answer}.`,
  };
}

const PLACES: { fr: string; pl?: boolean; g?: G }[] = [
  ...["cinéma", "gare", "école", "parc", "plage", "musée", "hôpital", "marché", "aéroport", "restaurant", "piscine", "église", "banque", "bibliothèque", "boulangerie", "théâtre", "hôtel", "mairie", "bureau", "pharmacie", "poste", "campagne", "château"].map((fr) => ({ fr })),
  { fr: "magasins", pl: true },
  { fr: "toilettes", pl: true },
  { fr: "États-Unis", pl: true },
];

function contracted(): Item {
  const p = pick(PLACES);
  const n = NOUN_MAP.get(p.fr);
  const withDe = Math.random() < 0.45;
  const el = !p.pl && elides(p.fr);
  const g = n?.g ?? "m";
  const answer = withDe ? (p.pl ? "des" : el ? "de l’" : g === "m" ? "du" : "de la") : p.pl ? "aux" : el ? "à l’" : g === "m" ? "au" : "à la";
  const en = withDe ? `de + … · from the ${n ? en1(n.en) : p.fr}` : `à + … · to the ${n ? en1(n.en) : p.fr}`;
  return {
    before: "",
    after: (answer.endsWith("’") ? "" : " ") + p.fr,
    en,
    options: withDe ? ["du", "de la", "de l’", "des"] : ["au", "à la", "à l’", "aux"],
    answer,
    explain: p.pl
      ? `${p.fr} is plural: ${withDe ? "de + les = des" : "à + les = aux"}.`
      : el
        ? `${p.fr} starts with a vowel sound: ${withDe ? "de l’" : "à l’"}, no contraction.`
        : g === "m"
          ? `${p.fr} is masculine: ${withDe ? "de + le = du" : "à + le = au"}.`
          : `${p.fr} is feminine: ${withDe ? "de la" : "à la"}, no contraction.`,
  };
}

const FOODS: { fr: string; pl?: boolean }[] = [
  ...["pain", "eau", "lait", "confiture", "fromage", "viande", "huile", "riz", "salade", "beurre", "soupe", "café", "thé", "chocolat", "farine", "sucre", "sel", "ail", "vin", "bière"].map((fr) => ({ fr })),
  { fr: "épinards", pl: true },
  { fr: "pâtes", pl: true },
  { fr: "frites", pl: true },
];

function partitive(): Item {
  const f = pick(FOODS);
  const n = NOUN_MAP.get(f.fr.replace(/s$/, "")) ?? NOUN_MAP.get(f.fr);
  const el = !f.pl && elides(f.fr);
  const answer = f.pl ? "des" : el ? "de l’" : n?.g === "f" ? "de la" : "du";
  return {
    before: "",
    after: (el ? "" : " ") + f.fr,
    en: n ? `some ${f.fr === "pâtes" ? "pasta" : f.fr === "épinards" ? "spinach" : f.pl ? enPlural(n.en) : en1(n.en)}` : undefined,
    options: ["du", "de la", "de l’", "des"],
    answer,
    explain: f.pl ? "Plural: des." : el ? `${f.fr} starts with a vowel: de l’.` : `${f.fr} is ${gname(n?.g ?? "m")}: ${answer}.`,
  };
}

function negationDe(): Item {
  const f = pick(FOODS.filter((x) => !x.pl));
  const n = NOUN_MAP.get(f.fr);
  const el = elides(f.fr);
  const answer = el ? "d’" : "de";
  const t = pick([["Je n’achète pas ", "."], ["Il n’y a plus ", "."], ["Nous n’avons pas ", "."], ["Tu ne veux pas ", " ?"]]);
  return {
    before: t[0],
    after: (el ? "" : " ") + f.fr + t[1],
    en: n ? `(${en1(n.en)})` : undefined,
    options: el ? ["d’", "de l’", "de", "du"] : ["de", "du", "de la", "des"],
    answer,
    explain: `After a negation, the partitive becomes ${answer}${el ? " before a vowel" : ""}.`,
  };
}

const PC_VERBS: { inf: string; pp: string; c: string; etre: boolean }[] = [
  { inf: "aller", pp: "allé", c: "au marché", etre: true },
  { inf: "venir", pp: "venu", c: "chez nous", etre: true },
  { inf: "partir", pp: "parti", c: "tôt", etre: true },
  { inf: "arriver", pp: "arrivé", c: "en retard", etre: true },
  { inf: "rester", pp: "resté", c: "à la maison", etre: true },
  { inf: "tomber", pp: "tombé", c: "dans la rue", etre: true },
  { inf: "naître", pp: "né", c: "en 1990", etre: true },
  { inf: "entrer", pp: "entré", c: "dans le café", etre: true },
  { inf: "sortir", pp: "sorti", c: "avec des amis", etre: true },
  { inf: "monter", pp: "monté", c: "au premier étage", etre: true },
  { inf: "descendre", pp: "descendu", c: "du train", etre: true },
  { inf: "devenir", pp: "devenu", c: "médecin", etre: true },
  { inf: "manger", pp: "mangé", c: "une pomme", etre: false },
  { inf: "finir", pp: "fini", c: "le livre", etre: false },
  { inf: "prendre", pp: "pris", c: "le bus", etre: false },
  { inf: "voir", pp: "vu", c: "un film", etre: false },
  { inf: "faire", pp: "fait", c: "les courses", etre: false },
  { inf: "lire", pp: "lu", c: "le journal", etre: false },
  { inf: "écrire", pp: "écrit", c: "une lettre", etre: false },
  { inf: "boire", pp: "bu", c: "un café", etre: false },
  { inf: "acheter", pp: "acheté", c: "du pain", etre: false },
  { inf: "dormir", pp: "dormi", c: "huit heures", etre: false },
  { inf: "parler", pp: "parlé", c: "avec Paul", etre: false },
];

const AV: Record<string, string> = { tu: "as", il: "a", elle: "a", nous: "avons", vous: "avez", ils: "ont", elles: "ont" };
const ET: Record<string, string> = { tu: "es", il: "est", elle: "est", nous: "sommes", vous: "êtes", ils: "sont", elles: "sont" };

function passeAux(): Item {
  const v = pick(PC_VERBS);
  const subj = v.etre ? pick(["il", "elle", "ils", "elles"]) : pick(["tu", "il", "elle", "nous", "vous", "ils", "elles"]);
  let pp = v.pp;
  if (v.etre) {
    if (subj === "elle") pp += "e";
    if (subj === "ils") pp += pp.endsWith("s") ? "" : "s";
    if (subj === "elles") pp += "es";
  }
  const answer = v.etre ? ET[subj] : AV[subj];
  return {
    before: v.inf === "naître" ? `${cap(subj)} ` : `Hier, ${subj} `,
    after: ` ${pp} ${v.c}.`,
    en: `(${v.inf})`,
    options: [AV[subj], ET[subj]],
    answer,
    explain: v.etre ? `${v.inf} takes être, and the participle agrees with the subject: ${subj} ${ET[subj]} ${pp}.` : `${v.inf} takes avoir, like most verbs.`,
  };
}

const PRES: { inf: string; c: string; en: string }[] = [
  { inf: "être", c: "à la maison", en: "to be at home" },
  { inf: "avoir", c: "un chat", en: "to have a cat" },
  { inf: "aller", c: "au marché", en: "to go to the market" },
  { inf: "faire", c: "les courses", en: "to do the shopping" },
  { inf: "pouvoir", c: "venir demain", en: "to be able to come tomorrow" },
  { inf: "vouloir", c: "un café", en: "to want a coffee" },
  { inf: "venir", c: "de Paris", en: "to come from Paris" },
  { inf: "prendre", c: "le bus", en: "to take the bus" },
  { inf: "devoir", c: "partir", en: "to have to leave" },
  { inf: "savoir", c: "nager", en: "to know how to swim" },
];
const SUBJ = ["je", "tu", "il", "elle", "nous", "vous", "ils", "elles"];
const SUBJ_IDX: Record<string, number> = { je: 0, tu: 1, il: 2, elle: 2, nous: 3, vous: 4, ils: 5, elles: 5 };

function presentIrregular(): Item {
  const v = pick(PRES);
  const c = conjugate(v.inf);
  const raw = c.forms.present.map((f) => f.replace(/^(j’|je |tu |il \/ elle |nous |vous |ils \/ elles )/, ""));
  let subj = pick(SUBJ);
  if (subj === "je" && /^[aeiouéè]/.test(raw[0])) subj = pick(SUBJ.slice(1));
  const answer = raw[SUBJ_IDX[subj]];
  const opts = shuffle(Array.from(new Set([answer, ...shuffle(raw.filter((r) => r !== answer)).slice(0, 3)])));
  return {
    before: cap(subj) + " ",
    after: " " + v.c + ".",
    en: `(${v.inf}: ${v.en})`,
    options: opts,
    answer,
    explain: `${v.inf} in the present: ${raw.join(", ")}.`,
  };
}

const IMP_PC: Item[] = [
  ["Quand j’étais petite, je ", " au parc tous les jours.", "jouer", "jouais", "ai joué", "A repeated habit in the past: imparfait."],
  ["Hier soir, nous ", " un film.", "regarder", "avons regardé", "regardions", "A completed action at a set time: passé composé."],
  ["Il ", " quand je suis sorti.", "pleuvoir", "pleuvait", "a plu", "Background (the weather) while something happened: imparfait."],
  ["Soudain, le téléphone ", ".", "sonner", "a sonné", "sonnait", "A sudden event: passé composé."],
  ["Elle ", " quand son frère est arrivé.", "lire", "lisait", "a lu", "An ongoing action interrupted by another: imparfait."],
  ["En 2010, ils ", " à Lyon.", "déménager", "ont déménagé", "déménageaient", "A one-off completed event: passé composé."],
  ["Le ciel ", " bleu et il faisait chaud.", "être", "était", "a été", "A description: imparfait."],
  ["Tous les étés, nous ", " à la mer.", "aller", "allions", "sommes allés", "A habit (tous les étés): imparfait."],
  ["Ce matin, ", " le bus.", "prendre", "j’ai pris", "je prenais", "A single completed action this morning: passé composé."],
  ["Autrefois, on ", " des lettres à la main.", "écrire", "écrivait", "a écrit", "A habit in the past (autrefois): imparfait."],
  ["Il ", " vingt ans quand il a rencontré Marie.", "avoir", "avait", "a eu", "Age and states in the past: imparfait."],
  ["Tout à coup, la porte ", ".", "s’ouvrir", "s’est ouverte", "s’ouvrait", "A sudden event (tout à coup): passé composé."],
  ["Quand nous sommes arrivés, il ", " nuit.", "faire", "faisait", "a fait", "Background description: imparfait."],
  ["Victor Hugo ", " en 1885.", "mourir", "est mort", "mourait", "A completed event with a date: passé composé."],
  ["Elle ", " ses devoirs, puis elle est sortie.", "finir", "a fini", "finissait", "A sequence of completed actions: passé composé."],
  ["Je ", " fatiguée, alors je suis rentrée.", "être", "étais", "ai été", "A state or feeling: imparfait."],
].map(([before, after, inf, ans, other, explain]) => ({ before, after, en: `(${inf})`, options: shuffle([ans, other]), answer: ans, explain }));

let impQueue: Item[] = [];
function imparfaitPc(): Item {
  if (!impQueue.length) impQueue = shuffle(IMP_PC);
  const it = impQueue.pop()!;
  return { ...it, options: shuffle(it.options) };
}

const GEN: Record<string, () => Item> = {
  definite,
  indefinite,
  contracted,
  partitive,
  "negation-de": negationDe,
  "passe-aux": passeAux,
  "present-irregular": presentIrregular,
  "imparfait-pc": imparfaitPc,
};

export function nextItem(ruleId: string, prev?: Item): Item {
  const g = GEN[ruleId] ?? definite;
  for (let i = 0; i < 6; i++) {
    const it = g();
    if (!prev || it.before + it.after !== prev.before + prev.after) return it;
  }
  return g();
}
