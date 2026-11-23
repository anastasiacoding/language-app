// Endless exercise generators for each grammar rule. Everything is built locally from word lists.
import { NOUNS, NOUN_MAP, elides, plural, addHMuet, type G, type Noun } from "../data/nouns";
import { conjugate, type Tense } from "./conjugate";
import { BANKS, BETTER, type BankItem } from "../data/banks";

export interface Item {
  prompt?: string; // shown instead of the sentence, e.g. "Make it negative: …"
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

let COUNTABLE: Noun[] = NOUNS.filter((n) => !["argent", "temps", "eau", "lait", "vin", "sucre", "sel", "beurre", "riz", "farine", "ail", "santé", "liberté", "vérité", "beauté", "peur", "joie", "amour", "chance", "silence", "nature", "culture", "musique", "neige", "pluie", "herbe", "huile", "confiture", "viande", "soupe", "thé", "café", "fromage", "pain", "chocolat"].includes(n.fr));

let BIG_VERBS: { inf: string; pp: string; etre: boolean; en: string }[] = [];
let loaded: Promise<void> | null = null;

/** Loads the large word list (about 3,500 nouns and 600 verbs from Wiktionary and Lexique). */
export function loadWords(): Promise<void> {
  if (!loaded)
    loaded = import("../data/practice.json").then((m: any) => {
      const d = m.default ?? m;
      addHMuet(d.hMuet);
      const clean = (en: string) => en.replace(/^(a|an|the)\s+/i, "");
      COUNTABLE = d.nouns.map(([fr, g, en, pl]: string[]) => ({ fr, g, en: clean(en), pl }));
      BIG_VERBS = d.verbs
        .slice(0, 300)
        .map(([inf, en]: string[]) => {
          const c = conjugate(inf);
          if (!c.supported || c.pronominal || ["falloir", "pleuvoir", "être", "avoir"].includes(inf)) return null;
          const pc = c.forms.passe[2];
          const pp = pc.split(" ").pop()!.replace(/\(e\)s?$/, "");
          return pp ? { inf, pp, etre: c.aux === "être", en } : null;
        })
        .filter(Boolean);
    });
  return loaded;
}

/** Picks a noun; plurals only for the ~1,200 most common, which pluralize naturally. */
function pickNoun() {
  const i = Math.floor(Math.random() * COUNTABLE.length);
  return { n: COUNTABLE[i], canPl: i < 1200 };
}

function definite(): Item {
  const { n, canPl } = pickNoun();
  const pl = canPl && Math.random() < 0.25;
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
  const { n, canPl } = pickNoun();
  const pl = canPl && Math.random() < 0.3;
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

const PLACES: { fr: string; pl?: boolean; g?: G; en?: string }[] = [
  ...["cinéma", "gare", "école", "parc", "plage", "musée", "hôpital", "marché", "aéroport", "restaurant", "piscine", "église", "banque", "bibliothèque", "boulangerie", "théâtre", "hôtel", "mairie", "bureau", "pharmacie", "poste", "campagne", "château"].map((fr) => ({ fr })),
  { fr: "magasins", pl: true, en: "shops" },
  { fr: "toilettes", pl: true, en: "toilets" },
  { fr: "États-Unis", pl: true, en: "United States" },
];

function contracted(): Item {
  // 40% everyday places, 60% any noun from the big list (à + le chat = au chat, de + l’homme…)
  let p: { fr: string; pl?: boolean; g?: G; en?: string } = pick(PLACES);
  let n: Noun | undefined = NOUN_MAP.get(p.fr);
  if (COUNTABLE.length > 300 && Math.random() < 0.6) {
    const r = pickNoun();
    const pl = r.canPl && Math.random() < 0.25;
    n = r.n;
    p = { fr: pl ? plural(r.n) : r.n.fr, pl, en: pl ? enPlural(r.n.en) : en1(r.n.en) };
  }
  const withDe = Math.random() < 0.45;
  const el = !p.pl && elides(p.fr);
  const g = n?.g ?? "m";
  const answer = withDe ? (p.pl ? "des" : el ? "de l’" : g === "m" ? "du" : "de la") : p.pl ? "aux" : el ? "à l’" : g === "m" ? "au" : "à la";
  const place = p.en ?? (n ? en1(n.en) : p.fr);
  const en = withDe ? `de + … · from the ${place}` : `à + … · to the ${place}`;
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

// Things you take "some" of: food, drink and abstract qualities. [noun, gender, english]
const MASS: [string, G | "pl", string][] = [
  ["pain", "m", "bread"], ["eau", "f", "water"], ["lait", "m", "milk"], ["confiture", "f", "jam"], ["fromage", "m", "cheese"],
  ["viande", "f", "meat"], ["huile", "f", "oil"], ["riz", "m", "rice"], ["salade", "f", "salad"], ["beurre", "m", "butter"],
  ["soupe", "f", "soup"], ["café", "m", "coffee"], ["thé", "m", "tea"], ["chocolat", "m", "chocolate"], ["farine", "f", "flour"],
  ["sucre", "m", "sugar"], ["sel", "m", "salt"], ["ail", "m", "garlic"], ["vin", "m", "wine"], ["bière", "f", "beer"],
  ["jambon", "m", "ham"], ["poulet", "m", "chicken"], ["poisson", "m", "fish"], ["bœuf", "m", "beef"], ["porc", "m", "pork"],
  ["agneau", "m", "lamb"], ["miel", "m", "honey"], ["moutarde", "f", "mustard"], ["crème", "f", "cream"], ["glace", "f", "ice cream"],
  ["jus", "m", "juice"], ["poivre", "m", "pepper"], ["vinaigre", "m", "vinegar"], ["yaourt", "m", "yogurt"], ["tarte", "f", "tart"],
  ["pizza", "f", "pizza"], ["gâteau", "m", "cake"], ["sauce", "f", "sauce"], ["limonade", "f", "lemonade"], ["eau gazeuse", "f", "sparkling water"],
  ["huile d’olive", "f", "olive oil"], ["purée", "f", "mashed potatoes"], ["semoule", "f", "semolina"], ["levure", "f", "yeast"], ["cannelle", "f", "cinnamon"],
  ["courage", "m", "courage"], ["patience", "f", "patience"], ["chance", "f", "luck"], ["temps", "m", "time"], ["argent", "m", "money"],
  ["travail", "m", "work"], ["musique", "f", "music"], ["bruit", "m", "noise"], ["soleil", "m", "sun"], ["vent", "m", "wind"],
  ["neige", "f", "snow"], ["pluie", "f", "rain"], ["énergie", "f", "energy"], ["humour", "m", "humour"], ["imagination", "f", "imagination"],
  ["talent", "m", "talent"], ["respect", "m", "respect"], ["espoir", "m", "hope"], ["fièvre", "f", "fever"], ["monde", "m", "people (a crowd)"],
  ["épinards", "pl", "spinach"], ["pâtes", "pl", "pasta"], ["frites", "pl", "fries"], ["céréales", "pl", "cereal"], ["légumes", "pl", "vegetables"],
  ["fruits", "pl", "fruit"], ["lentilles", "pl", "lentils"], ["haricots verts", "pl", "green beans"], ["fraises", "pl", "strawberries"], ["œufs", "pl", "eggs"],
];
const FOODS = MASS.map(([fr, g]) => ({ fr, pl: g === "pl" }));

function partitive(): Item {
  const [fr, g, en] = pick(MASS);
  const pl = g === "pl";
  const el = !pl && elides(fr);
  const answer = pl ? "des" : el ? "de l’" : g === "f" ? "de la" : "du";
  return {
    before: "",
    after: (el ? "" : " ") + fr,
    en: `some ${en}`,
    options: ["du", "de la", "de l’", "des"],
    answer,
    explain: pl ? "Plural: des." : el ? `${fr} starts with a vowel sound: de l’.` : `${fr} is ${gname(g as G)}: ${answer}.`,
  };
}

function negationDe(): Item {
  const useFood = Math.random() < 0.4;
  const f = useFood ? pick(FOODS.filter((x) => !x.pl)).fr : pick(COUNTABLE).fr;
  const m = MASS.find((x) => x[0] === f);
  const n = m ? { en: m[2] } : NOUN_MAP.get(f) ?? COUNTABLE.find((x) => x.fr === f);
  const el = elides(f);
  const answer = el ? "d’" : "de";
  return {
    before: "pas ",
    after: (el ? "" : " ") + f,
    en: n ? `no ${en1(n.en)} · ne … pas` : "ne … pas",
    options: el ? ["d’", "de l’", "de", "du"] : ["de", "du", "de la", "des"],
    answer,
    explain: `After a negation, un, une, des and the partitive become ${answer}${el ? " before a vowel" : ""}: il n’y a pas ${answer}${el ? "" : " "}${f}.`,
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
  if (BIG_VERBS.length && Math.random() < 0.6) {
    const b = pick(BIG_VERBS);
    const subj = b.etre ? pick(["il", "elle", "ils", "elles"]) : pick(["tu", "il", "elle", "nous", "vous", "ils", "elles"]);
    let pp = b.pp;
    if (b.etre) {
      if (subj === "elle") pp += "e";
      if (subj === "ils" && !pp.endsWith("s")) pp += "s";
      if (subj === "elles") pp += "es";
    }
    return {
      before: `Hier, ${subj} `,
      after: ` ${pp}.`,
      en: `(${b.inf} · ${b.en})`,
      options: [AV[subj], ET[subj]],
      answer: b.etre ? ET[subj] : AV[subj],
      explain: b.etre ? `${b.inf} takes être, and the participle agrees with the subject.` : `${b.inf} takes avoir, like most verbs.`,
    };
  }
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
  ["Chaque matin, mon grand-père ", " le journal.", "lire", "lisait", "a lu", "A daily habit (chaque matin): imparfait."],
  ["Hier, j’ai perdu mes clés et j’", " une heure à les chercher.", "passer", "ai passé", "passais", "A completed action with a set length: passé composé."],
  ["La maison ", " grande et il y avait un jardin.", "être", "était", "a été", "A description of a place: imparfait."],
  ["Nous ", " le train de 8 heures ce matin.", "rater", "avons raté", "rations", "A one-off event this morning: passé composé."],
  ["Quand il était étudiant, il ", " dans un café le soir.", "travailler", "travaillait", "a travaillé", "A repeated situation in the past: imparfait."],
  ["Elle ", " trois fois à Paris l’année dernière.", "aller", "est allée", "allait", "A counted number of times: passé composé."],
  ["Il ", " froid, alors j’ai mis un pull.", "faire", "faisait", "a fait", "Weather as background: imparfait."],
  ["D’un coup, le chien ", " vers la porte.", "courir", "a couru", "courait", "A sudden action (d’un coup): passé composé."],
  ["Les enfants ", " pendant que les parents préparaient le dîner.", "jouer", "jouaient", "ont joué", "Two actions going on at the same time: imparfait."],
  ["Ce jour-là, nous ", " une décision importante.", "prendre", "avons pris", "prenions", "A single completed decision: passé composé."],
  ["Autrefois, cette rue ", " beaucoup plus calme.", "être", "était", "a été", "How things used to be (autrefois): imparfait."],
  ["Le film ", " à 21 heures et a duré deux heures.", "commencer", "a commencé", "commençait", "A completed event in a sequence: passé composé."],
  ["Je ne ", " pas que tu étais là.", "savoir", "savais", "ai su", "A state of mind (savoir) in the past: imparfait."],
  ["Tout à coup, j’", " un bruit étrange.", "entendre", "ai entendu", "entendais", "A sudden event (tout à coup): passé composé."],
  ["Mon frère ", " les cheveux longs quand il avait seize ans.", "avoir", "avait", "a eu", "A description in the past: imparfait."],
  ["En 1969, l’homme ", " sur la Lune.", "marcher", "a marché", "marchait", "A historic one-off event with a date: passé composé."],
  ["Nous ", " souvent au cinéma le dimanche.", "aller", "allions", "sommes allés", "A habit (souvent, le dimanche): imparfait."],
  ["Hier, il ", " à sa mère pendant une heure.", "téléphoner", "a téléphoné", "téléphonait", "A completed action with a set length: passé composé."],
  ["Elle ", " heureuse dans son nouveau travail.", "se sentir", "se sentait", "s’est sentie", "A feeling over a period: imparfait."],
  ["L’avion ", " avec deux heures de retard.", "atterrir", "a atterri", "atterrissait", "A one-off completed event: passé composé."],
  ["Il était minuit et tout le monde ", ".", "dormir", "dormait", "a dormi", "Background scene (what was going on): imparfait."],
  ["J’", " mon premier livre en français l’été dernier.", "lire", "ai lu", "lisais", "A completed achievement: passé composé."],
  ["Quand j’habitais à Lyon, je ", " à vélo.", "se déplacer", "me déplaçais", "me suis déplacée", "A habit during a period: imparfait."],
].map(([before, after, inf, ans, other, explain]) => ({ before, after, en: `(${inf})`, options: shuffle([ans, other]), answer: ans, explain }));

let impQueue: Item[] = [];
function imparfaitPc(): Item {
  if (!impQueue.length) impQueue = shuffle(IMP_PC);
  const it = impQueue.pop()!;
  return { ...it, options: shuffle(it.options) };
}


// ════════════════════════ shared helpers for the A1–B2 generators ════════════════════════

const uniq = <T,>(a: T[]) => Array.from(new Set(a));
/** Answer plus up to n-1 distinct wrong options, shuffled. */
function opts(answer: string, wrongs: string[], n = 4) {
  return shuffle([answer, ...shuffle(uniq(wrongs.filter((w) => w && w !== answer))).slice(0, n - 1)]);
}
const vowelStart = (w: string) => elides(w) || /^(habit|hésit|hérit|humili|honor)/.test(w);
/** "que il" → "qu’il", "Si il" → "S’il" */
function joinElide(lead: string, word: string) {
  if (/(^|\s)(que|Que) $/.test(lead) && /^[aeiouéèh]/i.test(word) && !/^h/.test(word)) return lead.replace(/(que|Que) $/, (m) => m.slice(0, -2) + "’") + word;
  if (/(^|\s)(si|Si) $/.test(lead) && /^ils?\b/.test(word)) return lead.replace(/(si|Si) $/, (m) => m.slice(0, -2) + "’") + word;
  return lead + word;
}

const SUBJ_ALL = ["je", "tu", "il", "elle", "nous", "vous", "ils", "elles"];
const IDX: Record<string, number> = { je: 0, tu: 1, il: 2, elle: 2, on: 2, nous: 3, vous: 4, ils: 5, elles: 5 };
const PRON_RE = /^(je |j’|tu |il \/ elle |nous |vous |ils \/ elles )/;

/** A conjugated form split into the subject part ("j’", "tu ") and the verb part. */
function vform(inf: string, t: Tense, subj: string) {
  const f = conjugate(inf).forms[t][IDX[subj]] ?? "";
  const body = f.replace(PRON_RE, "").replace(/\(e\)s?$/, "");
  const pre = subj === "je" && f.startsWith("j’") ? "j’" : subj + " ";
  return { pre, body };
}

type V = { inf: string; pp: string; etre: boolean; en: string };
const BASIC = ["parler", "finir", "prendre", "faire", "aller", "venir", "voir", "manger", "boire", "lire", "écrire", "partir", "dormir", "travailler", "regarder", "choisir", "attendre", "vendre", "répondre", "sortir", "arriver", "chanter", "danser", "acheter", "comprendre", "apprendre", "ouvrir", "mettre", "dire", "courir"];
let FALLBACK: V[] | null = null;
function verbPool(): V[] {
  if (BIG_VERBS.length) return BIG_VERBS;
  if (!FALLBACK)
    FALLBACK = BASIC.map((inf) => {
      const c = conjugate(inf);
      const pp = c.forms.passe[2].split(" ").pop()!.replace(/\(e\)s?$/, "");
      return { inf, pp, etre: c.aux === "être", en: c.en };
    });
  return FALLBACK;
}
const pickVerb = (f?: (v: V) => boolean) => pick(f ? verbPool().filter(f) : verbPool());

/** Participle agreement for être: subject gender/number. */
function agree(pp: string, g: G, pl: boolean) {
  let w = pp;
  if (g === "f" && !w.endsWith("e")) w += "e";
  if (pl && !w.endsWith("s")) w += "s";
  return w;
}
function agreeForms(pp: string) {
  return uniq([pp, agree(pp, "f", false), agree(pp, "m", true), agree(pp, "f", true)]);
}
const PEOPLE_SUBJ: [string, G, boolean, string][] = [
  ["Marie", "f", false, "Marie"], ["Paul", "m", false, "Paul"], ["Léa et Emma", "f", true, "Léa and Emma"], ["Paul et Marc", "m", true, "Paul and Marc"],
  ["Ma sœur", "f", false, "My sister"], ["Mon frère", "m", false, "My brother"], ["Les filles", "f", true, "The girls"], ["Les garçons", "m", true, "The boys"],
  ["Julie et Thomas", "m", true, "Julie and Thomas"], ["Ma voisine", "f", false, "My neighbour (f)"],
];
const genderWord = (g: G, pl: boolean) => (pl ? (g === "m" ? "masculine plural" : "feminine plural") : g === "m" ? "masculine" : "feminine");
const theNoun = (n: Noun, pl: boolean) => (pl ? "les " + plural(n) : elides(n.fr) ? "l’" + n.fr : (n.g === "m" ? "le " : "la ") + n.fr);
const enOf = (n: Noun, pl: boolean) => (pl ? enPlural(n.en) : en1(n.en));
function nounPick(plChance: number) {
  const { n, canPl } = pickNoun();
  return { n, pl: canPl && Math.random() < plChance };
}

// ════════════════════════ A1 ════════════════════════

function pluralNouns(): Item {
  let n = pickNoun().n;
  for (let i = 0; i < 8 && /[^sxz]$/.test(n.fr) && plural(n) === n.fr + "s" && Math.random() < 0.6; i++) n = COUNTABLE[Math.floor(Math.random() * Math.min(1200, COUNTABLE.length))];
  const answer = plural(n);
  const wrongs = [n.fr + "s", n.fr, /ou$/.test(n.fr) ? n.fr + "x" : "", /al$/.test(n.fr) ? n.fr.slice(0, -2) + "aux" : "", /al$/.test(n.fr) ? n.fr + "s" : ""];
  const why = answer === n.fr ? `${n.fr} already ends in -s, -x or -z, so it doesn’t change.` : /aux$/.test(answer) && /al$/.test(n.fr) ? `Nouns in -al usually become -aux.` : /x$/.test(answer) ? `Nouns in -eau, -au, -eu usually add -x.` : answer === n.fr + "s" ? `Most nouns just add -s.` : `${n.fr} has an irregular plural: ${answer}.`;
  return { before: `${n.g === "m" ? "un" : "une"} ${n.fr} → des `, after: "", en: `${en1(n.en)} → ${enPlural(n.en)}`, options: opts(answer, wrongs), answer, explain: why };
}

const OWNERS: { en: string; f: [string, string, string] }[] = [
  { en: "my", f: ["mon", "ma", "mes"] }, { en: "your (tu)", f: ["ton", "ta", "tes"] }, { en: "his / her", f: ["son", "sa", "ses"] },
  { en: "our", f: ["notre", "notre", "nos"] }, { en: "your (vous)", f: ["votre", "votre", "vos"] }, { en: "their", f: ["leur", "leur", "leurs"] },
];
function possessives(): Item {
  const o = pick(OWNERS);
  const { n, pl } = nounPick(0.3);
  const vowelF = !pl && n.g === "f" && elides(n.fr);
  const answer = pl ? o.f[2] : n.g === "m" || vowelF ? o.f[0] : o.f[1];
  const other = pick(OWNERS.filter((x) => x !== o));
  return {
    before: "", after: " " + (pl ? plural(n) : n.fr), en: `${o.en} ${enOf(n, pl)}`,
    options: opts(answer, [...o.f, pl ? other.f[2] : other.f[0], other.f[1]]), answer,
    explain: pl ? `Plural noun: ${o.f[2]}.` : vowelF ? `${n.fr} is feminine but starts with a vowel sound, so ${o.f[0]}.` : `${n.fr} is ${gname(n.g)}: ${answer}.`,
  };
}

function demonstratives(): Item {
  const { n, pl } = nounPick(0.3);
  const answer = pl ? "ces" : n.g === "f" ? "cette" : elides(n.fr) ? "cet" : "ce";
  return {
    before: "", after: " " + (pl ? plural(n) : n.fr), en: `${pl ? "these / those" : "this / that"} ${enOf(n, pl)}`, options: ["ce", "cet", "cette", "ces"], answer,
    explain: pl ? "Plural: ces." : answer === "cet" ? `${n.fr} is masculine and starts with a vowel sound: cet.` : `${n.fr} is ${gname(n.g)}: ${answer}.`,
  };
}

// [masculine, feminine, english, kind: t = things, p = people, b = both, BAGS: goes before the noun]
const ADJ: [string, string, string, "t" | "p" | "b", 1?][] = [
  ["grand", "grande", "big", "b", 1], ["petit", "petite", "small", "b", 1], ["beau", "belle", "beautiful", "b", 1], ["joli", "jolie", "pretty", "b", 1], ["bon", "bonne", "good", "b", 1],
  ["mauvais", "mauvaise", "bad", "b", 1], ["jeune", "jeune", "young", "p", 1], ["vieux", "vieille", "old", "b", 1], ["nouveau", "nouvelle", "new", "t", 1], ["gros", "grosse", "big", "t", 1], ["long", "longue", "long", "t", 1],
  ["heureux", "heureuse", "happy", "p"], ["sérieux", "sérieuse", "serious", "p"], ["cher", "chère", "expensive", "t"], ["fier", "fière", "proud", "p"], ["actif", "active", "active", "p"],
  ["sportif", "sportive", "sporty", "p"], ["neuf", "neuve", "brand new", "t"], ["gentil", "gentille", "kind", "p"], ["intelligent", "intelligente", "clever", "p"], ["content", "contente", "pleased", "p"],
  ["fatigué", "fatiguée", "tired", "p"], ["occupé", "occupée", "busy", "p"], ["rapide", "rapide", "fast", "t"], ["moderne", "moderne", "modern", "t"], ["calme", "calme", "calm", "b"],
  ["propre", "propre", "clean", "t"], ["sale", "sale", "dirty", "t"], ["rouge", "rouge", "red", "t"], ["noir", "noire", "black", "t"], ["blanc", "blanche", "white", "t"], ["vert", "verte", "green", "t"],
  ["bleu", "bleue", "blue", "t"], ["gris", "grise", "grey", "t"], ["violet", "violette", "purple", "t"], ["frais", "fraîche", "fresh", "t"], ["doux", "douce", "soft", "b"], ["faux", "fausse", "false", "t"],
  ["sec", "sèche", "dry", "t"], ["italien", "italienne", "Italian", "p"], ["canadien", "canadienne", "Canadian", "p"], ["français", "française", "French", "p"], ["anglais", "anglaise", "English", "p"],
  ["américain", "américaine", "American", "p"], ["normal", "normale", "normal", "b"], ["original", "originale", "original", "t"], ["spécial", "spéciale", "special", "t"], ["cruel", "cruelle", "cruel", "p"],
  ["naturel", "naturelle", "natural", "t"], ["bas", "basse", "low", "t"], ["épais", "épaisse", "thick", "t"], ["chaud", "chaude", "hot", "t"], ["froid", "froide", "cold", "t"], ["léger", "légère", "light", "t"],
  ["cassé", "cassée", "broken", "t"], ["ouvert", "ouverte", "open", "t"], ["fermé", "fermée", "closed", "t"], ["plein", "pleine", "full", "t"], ["vide", "vide", "empty", "t"], ["lourd", "lourde", "heavy", "t"],
  ["curieux", "curieuse", "curious", "p"], ["nerveux", "nerveuse", "nervous", "p"], ["créatif", "créative", "creative", "p"], ["mignon", "mignonne", "cute", "b"], ["célèbre", "célèbre", "famous", "b"],
  ["important", "importante", "important", "t"], ["intéressant", "intéressante", "interesting", "t"], ["connu", "connue", "well-known", "b"], ["drôle", "drôle", "funny", "p"], ["timide", "timide", "shy", "p"],
  ["grec", "grecque", "Greek", "p"], ["public", "publique", "public", "t"], ["ancien", "ancienne", "old, former", "t"], ["dangereux", "dangereuse", "dangerous", "t"],
];
const mplOf = (m: string) => (/[sx]$/.test(m) ? m : /eau$/.test(m) ? m + "x" : /al$/.test(m) ? m.slice(0, -2) + "aux" : m + "s");
const adjForm = (a: (typeof ADJ)[number], g: G, pl: boolean) => (pl ? (g === "m" ? mplOf(a[0]) : a[1] + "s") : g === "m" ? a[0] : a[1]);
const PEOPLE: [string, G, boolean, string][] = [
  ["Ma sœur", "f", false, "My sister"], ["Mon frère", "m", false, "My brother"], ["Mes cousines", "f", true, "My cousins (f)"], ["Mes cousins", "m", true, "My cousins"],
  ["Les étudiantes", "f", true, "The students (f)"], ["Les enfants", "m", true, "The children"], ["Mon voisin", "m", false, "My neighbour"], ["Ma voisine", "f", false, "My neighbour (f)"],
  ["Julie", "f", false, "Julie"], ["Paul", "m", false, "Paul"], ["Léa et Emma", "f", true, "Léa and Emma"], ["Marc et Julie", "m", true, "Marc and Julie"],
  ["La directrice", "f", false, "The director (f)"], ["Le serveur", "m", false, "The waiter"], ["Mes grands-parents", "m", true, "My grandparents"], ["Mes amies", "f", true, "My friends (f)"],
];

function adjectiveAgreement(): Item {
  let subj: string, g: G, pl: boolean, enS: string, a: (typeof ADJ)[number];
  if (Math.random() < 0.5) {
    const p = pick(PEOPLE);
    [subj, g, pl, enS] = p;
    a = pick(ADJ.filter((x) => x[3] !== "t"));
  } else {
    const r = nounPick(0.35);
    subj = cap(theNoun(r.n, r.pl));
    g = r.n.g;
    pl = r.pl;
    enS = "The " + enOf(r.n, r.pl);
    a = pick(ADJ.filter((x) => x[3] !== "p"));
  }
  const answer = adjForm(a, g, pl);
  const mixed = / et /.test(subj) && g === "m";
  return {
    before: `${subj} ${pl ? "sont" : "est"} `, after: ".", en: `${enS} ${pl ? "are" : "is"} ${a[2]}.`,
    options: opts(answer, [adjForm(a, "m", false), adjForm(a, "f", false), adjForm(a, "m", true), adjForm(a, "f", true)]), answer,
    explain: mixed ? `A mixed group takes the masculine plural: ${answer}.` : `${subj.replace(/^(Le |La |L’|Les )/, "")} is ${genderWord(g, pl)}: ${answer}.`,
  };
}

const PRES_ER = (v: V) => v.inf.endsWith("er") && v.inf !== "aller";
function presentForms(rule: "er" | "ir-re"): Item {
  const v = rule === "er" ? pickVerb(PRES_ER) : pickVerb((x) => /(ir|re)$/.test(x.inf) && !conjugate(x.inf).irregular);
  const subj = pick(SUBJ_ALL);
  const { pre, body } = vform(v.inf, "present", subj);
  const all = conjugate(v.inf).forms.present.map((f) => f.replace(PRON_RE, ""));
  return {
    before: cap(pre), after: ".", en: `(${v.inf} · ${v.en})`, options: opts(body, all), answer: body,
    explain: `${v.inf} in the present: ${all.join(", ")}.`,
  };
}

const COUNTRIES: [string, "en" | "au" | "aux", string][] = [
  ...(["France", "Espagne", "Italie", "Allemagne", "Belgique", "Suisse", "Angleterre", "Chine", "Russie", "Grèce", "Inde", "Australie", "Argentine", "Norvège", "Suède", "Pologne", "Turquie", "Égypte", "Irlande", "Autriche", "Corée", "Colombie", "Tunisie", "Algérie", "Ukraine", "Croatie", "Hongrie", "Roumanie", "Iran", "Équateur"].map((c) => [c, "en", c] as [string, "en", string])),
  ...(["Japon", "Canada", "Brésil", "Portugal", "Mexique", "Maroc", "Danemark", "Pérou", "Chili", "Vietnam", "Sénégal", "Liban", "Royaume-Uni", "Luxembourg", "Cameroun"].map((c) => [c, "au", c] as [string, "au", string])),
  ["États-Unis", "aux", "the United States"], ["Pays-Bas", "aux", "the Netherlands"], ["Philippines", "aux", "the Philippines"],
];
const EN_PLACE: Record<string, string> = {
  Espagne: "Spain", Italie: "Italy", Allemagne: "Germany", Belgique: "Belgium", Suisse: "Switzerland", Angleterre: "England", Chine: "China", Russie: "Russia", Grèce: "Greece", Inde: "India",
  Australie: "Australia", Norvège: "Norway", Suède: "Sweden", Pologne: "Poland", Turquie: "Turkey", Égypte: "Egypt", Irlande: "Ireland", Autriche: "Austria", Corée: "Korea", Colombie: "Colombia",
  Tunisie: "Tunisia", Algérie: "Algeria", Croatie: "Croatia", Hongrie: "Hungary", Roumanie: "Romania", Équateur: "Ecuador", Japon: "Japan", Brésil: "Brazil", Mexique: "Mexico", Maroc: "Morocco",
  Danemark: "Denmark", Pérou: "Peru", Sénégal: "Senegal", Liban: "Lebanon", "Royaume-Uni": "the United Kingdom", Cameroun: "Cameroon", Londres: "London", Bruxelles: "Brussels", Genève: "Geneva",
  Lisbonne: "Lisbon", Moscou: "Moscow", Athènes: "Athens", Montréal: "Montreal", Québec: "Quebec City",
};
const CITIES = ["Paris", "Lyon", "Marseille", "Londres", "Rome", "Madrid", "Berlin", "Tokyo", "Montréal", "Bruxelles", "Genève", "New York", "Lisbonne", "Moscou", "Athènes", "Nice", "Bordeaux", "Lille", "Dakar", "Québec"];
const PLACE_TPL: [string, string][] = [["J’habite ", "I live in"], ["Nous allons ", "We’re going to"], ["Elle travaille ", "She works in"], ["Ils partent ", "They’re leaving for"], ["Je suis né ", "I was born in"], ["Tu vas ", "Are you going to"]];
function places(): Item {
  const [lead, enLead] = pick(PLACE_TPL);
  const city = Math.random() < 0.3;
  const [name, prep, enName0] = city ? [pick(CITIES), "à" as const, ""] : pick(COUNTRIES);
  const enName = EN_PLACE[name] ?? enName0;
  const q = lead === "Tu vas ";
  return {
    before: lead, after: ` ${name}${q ? " ?" : "."}`, en: `${enLead} ${enName || name}${q ? "?" : ""}`, options: ["à", "en", "au", "aux"], answer: prep,
    explain: prep === "à" ? `${name} is a city: à.` : prep === "aux" ? `${name} is plural: aux.` : prep === "au" ? `${name} is a masculine country: au.` : /^[AEIOUÉ]/.test(name) ? `${name} starts with a vowel: en.` : `${name} is a feminine country: en.`,
  };
}

const PERS: [string, string, string, string, string][] = [
  ["me", "moi", "je", "j’adore", "my"], ["you (tu)", "toi", "tu", "tu adores", "your"], ["him", "lui", "il", "il adore", "his"], ["her", "elle", "elle", "elle adore", "her"],
  ["us", "nous", "nous", "nous adorons", "our"], ["you (vous)", "vous", "vous", "vous adorez", "your"], ["them (m)", "eux", "ils", "ils adorent", "their (m)"], ["them (f)", "elles", "elles", "elles adorent", "their (f)"],
];
const TONIC_TPL: [string, (p: string, poss: string) => string][] = [
  ["C’est pour ___.", (p) => `It’s for ${p}.`], ["Tu viens avec ___ ?", (p) => `Are you coming with ${p}?`], ["Elle est partie sans ___.", (p) => `She left without ${p}.`],
  ["Je pense souvent à ___.", (p) => `I often think about ${p}.`], ["Il habite à côté de ___.", (p) => `He lives next to ${p}.`], ["On dîne chez ___ ce soir.", (_, poss) => `We’re having dinner at ${poss} place tonight.`],
];
function stressedPronouns(): Item {
  const p = pick(PERS);
  let s: string, en: string;
  if (Math.random() < 0.25) {
    s = `___, ${p[3]} le chocolat.`;
    en = `(${p[0]}), with emphasis: … love(s) chocolate.`;
  } else {
    const t = pick(TONIC_TPL);
    s = t[0];
    en = t[1](p[0], p[4]);
  }
  const [before, after] = s.split("___");
  const answer = before === "" ? cap(p[1]) : p[1];
  const all = PERS.map((x) => (before === "" ? cap(x[1]) : x[1]));
  return { before, after, en, options: opts(answer, all), answer, explain: `${p[0]} → ${p[1]}. After a preposition, after c’est and for emphasis, use the stressed pronoun.` };
}

function quel(): Item {
  const { n, pl } = nounPick(0.3);
  const answer = pl ? (n.g === "m" ? "quels" : "quelles") : n.g === "m" ? "quel" : "quelle";
  return {
    before: "", after: ` ${pl ? plural(n) : n.fr} préfères-tu ?`, en: `Which ${enOf(n, pl)} do you prefer?`, options: ["Quel", "Quelle", "Quels", "Quelles"], answer: cap(answer),
    explain: `${n.fr} is ${genderWord(n.g, pl)}: ${answer}.`,
  };
}

const ALLER = ["vais", "vas", "va", "allons", "allez", "vont"];
function futurProche(): Item {
  const v = pickVerb();
  const subj = pick(SUBJ_ALL);
  const answer = ALLER[IDX[subj]];
  const cue = pick(["Demain", "Ce soir", "La semaine prochaine", "Bientôt", "Cet été", "Tout à l’heure"]);
  return {
    before: `${cue}, ${subj} `, after: ` ${v.inf}.`, en: `going to ${v.en.replace(/^to /, "")}`, options: opts(answer, ALLER), answer,
    explain: `Near future: aller in the present + infinitive. ${subj} ${answer} ${v.inf}.`,
  };
}

const NEG_PAIRS: [string, string][] = [
  ["parler", "français"], ["aimer", "le café"], ["habiter", "à Paris"], ["travailler", "le samedi"], ["regarder", "la télé"], ["prendre", "le bus"], ["écouter", "la radio"],
  ["lire", "le journal"], ["comprendre", "la question"], ["jouer", "au tennis"], ["conduire", "vite"], ["manger", "à midi"], ["dormir", "bien"], ["connaître", "Marie"],
  ["aller", "au cinéma"], ["rester", "à la maison"], ["finir", "tard"], ["chanter", "bien"], ["courir", "le matin"], ["savoir", "la réponse"], ["acheter", "le pain"], ["oublier", "ses clés"],
];
function negation(): Item {
  const [inf, comp] = pick(NEG_PAIRS);
  const subj = pick(SUBJ_ALL);
  const S = cap(subj);
  const pc = conjugate(inf).aux === "avoir" && Math.random() < 0.35;
  if (pc) {
    const { pre, body } = vform(inf, "passe", subj);
    const [aux, pp] = body.split(" ");
    const ne = vowelStart(aux) ? "n’" : "ne ";
    return {
      prompt: `Make it negative: ${cap(pre)}${body} ${comp}.`, before: "", after: "", options: shuffle([`${S} ${ne}${aux} pas ${pp} ${comp}.`, `${S} ${ne}${aux} ${pp} pas ${comp}.`, `${S} ne pas ${aux} ${pp} ${comp}.`]),
      answer: `${S} ${ne}${aux} pas ${pp} ${comp}.`, explain: "In the passé composé, ne … pas goes around the auxiliary.",
    };
  }
  const { pre, body } = vform(inf, "present", subj);
  const v = vowelStart(body);
  const answer = `${S} ${v ? "n’" : "ne "}${body} pas ${comp}.`;
  const wrongs = [`${S} ne pas ${body} ${comp}.`, v ? `${S} ne ${body} pas ${comp}.` : `${cap(pre)}${body} ne pas ${comp}.`];
  return {
    prompt: `Make it negative: ${cap(pre)}${body} ${comp}.`, before: "", after: "", options: opts(answer, wrongs), answer,
    explain: v ? "Ne becomes n’ before a vowel, and pas goes after the verb." : "Ne goes before the verb and pas after it.",
  };
}

// ════════════════════════ A2 ════════════════════════

const BAGS_ADJ = ADJ.filter((a) => a[3] !== "p");
function adjectivePosition(): Item {
  const aa = Math.random() < 0.5 ? pick(BAGS_ADJ.filter((x) => x[4])) : pick(BAGS_ADJ.filter((x) => !x[4]));
  let n = pickNoun().n;
  for (let i = 0; i < 10 && elides(n.fr); i++) n = pickNoun().n;
  const art = n.g === "m" ? "un" : "une";
  const form = adjForm(aa, n.g, false);
  const wrongForm = adjForm(aa, n.g === "m" ? "f" : "m", false);
  const before = `${art} ${form} ${n.fr}`;
  const after = `${art} ${n.fr} ${form}`;
  const answer = aa[4] ? before : after;
  const wrongs = [aa[4] ? after : before];
  if (wrongForm !== form) wrongs.push(aa[4] ? `${art} ${wrongForm} ${n.fr}` : `${art} ${n.fr} ${wrongForm}`);
  return {
    prompt: `${/^[aeiou]/.test(aa[2]) ? "an" : "a"} ${aa[2]} ${en1(n.en)}`, before: "", after: "", options: shuffle([answer, ...wrongs]), answer,
    explain: aa[4] ? `${aa[0]} is a BAGS adjective (beauty, age, goodness, size), so it goes before the noun.` : `${aa[0]} goes after the noun, like most adjectives.`,
  };
}

const NAMES: [string, G][] = [["Paul", "m"], ["Marc", "m"], ["Louis", "m"], ["Thomas", "m"], ["Léa", "f"], ["Julie", "f"], ["Chloé", "f"], ["Sophie", "f"]];
function comparatives(): Item {
  if (Math.random() < 0.3) {
    const [s, answer, en] = pick(BETTER);
    const [before, after] = s.split("___");
    return { before, after, en, options: opts(answer, ["meilleur", "meilleure", "meilleurs", "meilleures", "mieux"]), answer, explain: answer === "mieux" ? "Mieux is the comparative of bien (adverb: how you do something)." : `Meilleur is the comparative of bon (adjective), and it agrees: ${answer}.` };
  }
  const A = pick(NAMES);
  const B = pick(NAMES.filter((x) => x !== A));
  const a = pick(ADJ.filter((x) => x[3] !== "t" && !["italien", "canadien", "français", "anglais", "américain", "grec", "bon", "mauvais"].includes(x[0])));
  const k = Math.floor(Math.random() * 3);
  const answer = ["plus", "moins", "aussi"][k];
  const enW = [`more ${a[2]} than`, `less ${a[2]} than`, `as ${a[2]} as`][k];
  return {
    before: `${A[0]} est `, after: ` ${adjForm(a, A[1], false)} que ${B[0]}.`, en: `${A[0]} is ${enW} ${B[0]}.`, options: ["plus", "moins", "aussi"], answer,
    explain: `${["more", "less", "as"][k]} → ${answer} … que. The adjective agrees with ${A[0]}.`,
  };
}

const SUP_ADJ = ADJ.filter((a) => ["cher", "moderne", "propre", "original", "lourd", "léger", "célèbre", "important", "intéressant", "connu", "calme", "rapide", "ancien", "dangereux"].includes(a[0]));
function superlatives(): Item {
  const { n, pl } = nounPick(0.3);
  const a = pick(SUP_ADJ);
  const less = Math.random() < 0.25;
  const w = less ? "moins" : "plus";
  const art = pl ? "les" : n.g === "m" ? "le" : "la";
  const answer = `${art} ${w}`;
  const end = pick([" de la ville", " du magasin", " de la liste", " du monde"]);
  const before = pl ? `Ce sont ${theNoun(n, true)} ` : `C’est ${theNoun(n, false)} `;
  return {
    before, after: ` ${adjForm(a, n.g, pl)}${end}.`, en: `the ${less ? "least" : "most"} ${a[2]} ${enOf(n, pl)}`, options: [`le ${w}`, `la ${w}`, `les ${w}`, w], answer,
    explain: `${pl ? plural(n) : n.fr} is ${genderWord(n.g, pl)}, so the article is ${art}, repeated after the noun.`,
  };
}

function tout(): Item {
  const { n, pl } = nounPick(0.4);
  const el = !pl && elides(n.fr);
  const answer = pl ? (n.g === "m" ? "tous les" : "toutes les") : el ? (n.g === "m" ? "tout l’" : "toute l’") : n.g === "m" ? "tout le" : "toute la";
  const options = el ? ["tout l’", "toute l’", "tous les", "toutes les"] : ["tout le", "toute la", "tous les", "toutes les"];
  return {
    before: "", after: (el ? "" : " ") + (pl ? plural(n) : n.fr), en: pl ? `all the ${enPlural(n.en)}` : `the whole ${en1(n.en)}`, options, answer,
    explain: `${pl ? plural(n) : n.fr} is ${genderWord(n.g, pl)}: ${answer}.`,
  };
}

function pastParticiples(): Item {
  const reg = (inf: string) => inf.replace(/er$/, "é").replace(/oir$/, "u").replace(/ir$/, "i").replace(/re$/, "u");
  const irregular = Math.random() < 0.7;
  const v = pickVerb((x) => (irregular ? x.pp !== reg(x.inf) : true));
  const base = v.inf.replace(/(er|oir|ir|re)$/, "");
  const wrongs = [base + "é", base + "i", base + "u", base + "is", base + "it", reg(v.inf)].filter((w) => !/[aeiouy][iuéy][st]?$/.test(w));
  return {
    before: v.etre ? "Hier, il est " : "Hier, j’ai ", after: ".", en: `(${v.inf} · ${v.en})`, options: opts(v.pp, [...wrongs, wrongs.length < 2 ? v.inf : ""]), answer: v.pp,
    explain: v.pp === reg(v.inf) ? `${v.inf} is regular: ${v.pp}.` : `${v.inf} has an irregular past participle: ${v.pp}.`,
  };
}

const ETRE_VERBS = PC_VERBS.filter((v) => v.etre);
function pcAgreement(): Item {
  const big = verbPool().filter((v) => v.etre);
  const v = Math.random() < 0.5 && big.length ? pick(big) : pick(ETRE_VERBS);
  const [S, g, pl] = pick(PEOPLE_SUBJ);
  const answer = agree(v.pp, g, pl);
  return {
    before: `${S} ${pl ? "sont" : "est"} `, after: " hier.", en: `(${v.inf})`, options: agreeForms(v.pp).length > 1 ? shuffle(agreeForms(v.pp)) : [answer], answer,
    explain: `${v.inf} takes être, so the participle agrees with the subject (${genderWord(g, pl)}): ${answer}.`,
  };
}

function tenseItem(t: Tense, cues: string[], others: Tense[], label: string): Item {
  const v = pickVerb();
  const subj = pick(SUBJ_ALL);
  const { pre, body } = vform(v.inf, t, subj);
  const cue = pick(cues);
  const otherTense = uniq(others.map((o) => vform(v.inf, o, subj).body)).filter((w) => w !== body);
  const otherPerson = uniq(SUBJ_ALL.map((s) => vform(v.inf, t, s).body)).filter((w) => w !== body);
  const options = shuffle(uniq([body, ...otherTense.slice(0, 2), ...shuffle(otherPerson)]).slice(0, 4));
  const full = conjugate(v.inf).forms[t];
  return {
    before: joinElide(cue, pre.trimEnd()) + (pre.endsWith("’") ? "" : " "), after: ".", en: `(${v.inf} · ${v.en})`, options, answer: body,
    explain: `${v.inf} in the ${label}: ${full[0]}, ${full[3]}, ${full[5].replace("ils / elles", "ils")}.`,
  };
}
const imparfaitForms = () => tenseItem("imparfait", ["Autrefois, ", "Avant, ", "Chaque été, ", "Quand nous étions jeunes, "], ["present", "futur"], "imparfait");
const futurSimple = () => tenseItem("futur", ["Demain, ", "L’année prochaine, ", "Dans dix ans, ", "Un jour, "], ["conditionnel", "present"], "futur simple");
const conditionnel = () => tenseItem("conditionnel", ["Avec plus de temps, ", "Avec plus d’argent, ", "Dans un monde idéal, ", "Avec un peu de chance, "], ["futur", "imparfait"], "conditionnel");
const subjonctif = () => tenseItem("subjonctif", ["Il faut que ", "Il est important que ", "Il est possible que ", "Bien que "], ["present", "imparfait"], "subjonctif");

const VENIR = ["viens", "viens", "vient", "venons", "venez", "viennent"];
function passeRecent(): Item {
  const v = pickVerb();
  const subj = pick(SUBJ_ALL);
  const d = vowelStart(v.inf) ? "d’" : "de";
  const answer = `${VENIR[IDX[subj]]} ${d}`;
  const other = VENIR[(IDX[subj] + 3) % 6];
  return {
    before: `${cap(subj)} `, after: (d === "d’" ? "" : " ") + v.inf + ".", en: `has / have just: ${v.en.replace(/^to /, "")}`,
    options: opts(answer, [`${other} ${d}`, `${VENIR[IDX[subj]]} à`, ALLER[IDX[subj]], `${other} à`]), answer,
    explain: `Recent past: venir + de + infinitive${d === "d’" ? " (de → d’ before a vowel)" : ""}.`,
  };
}

const PRONOMINAL: [string, string][] = [
  ["se lever", "to get up"], ["se laver", "to wash"], ["se coucher", "to go to bed"], ["se réveiller", "to wake up"], ["s’habiller", "to get dressed"], ["se promener", "to go for a walk"],
  ["se dépêcher", "to hurry"], ["s’appeler", "to be called"], ["s’amuser", "to have fun"], ["se reposer", "to rest"], ["se préparer", "to get ready"], ["se maquiller", "to put on make-up"],
  ["se doucher", "to shower"], ["s’asseoir", "to sit down"], ["s’occuper", "to take care"], ["s’intéresser", "to be interested"], ["se tromper", "to make a mistake"], ["se marier", "to get married"],
  ["se sentir", "to feel"], ["s’endormir", "to fall asleep"], ["se perdre", "to get lost"], ["s’habituer", "to get used to"], ["s’arrêter", "to stop"], ["se baigner", "to swim (in the sea)"], ["s’ennuyer", "to be bored"],
];
function reflexive(): Item {
  const [inf, en] = pick(PRONOMINAL);
  const subj = pick(SUBJ_ALL);
  const { body } = vform(inf, "present", subj);
  const m = body.match(/^(me |te |se |nous |vous |m’|t’|s’)(.*)$/);
  if (!m) return presentForms("er");
  const answer = m[1].trim();
  const el = answer.endsWith("’");
  return {
    before: `${cap(subj)} `, after: (el ? "" : " ") + m[2] + ".", en: `(${inf} · ${en})`,
    options: opts(answer, el ? ["m’", "t’", "s’", "nous", "vous"] : ["me", "te", "se", "nous", "vous"]), answer,
    explain: `The pronoun matches the subject: ${subj} → ${answer}${el ? " (elided before a vowel)" : ""}.`,
  };
}

const IMP_IRR: Record<string, [string, string, string]> = { être: ["sois", "soyons", "soyez"], avoir: ["aie", "ayons", "ayez"], savoir: ["sache", "sachons", "sachez"], vouloir: ["veuille", "voulons", "veuillez"] };
const NO_IMP = ["devoir", "pouvoir", "souvenir", "falloir", "valoir", "sembler", "paraître", "suffire", "coûter", "durer", "exister", "dépendre", "appartenir", "naître", "mourir"];
function imperative(): Item {
  const v = pickVerb((x) => !NO_IMP.includes(x.inf));
  const who = pick(["tu", "nous", "vous"] as const);
  const tuP = vform(v.inf, "present", "tu").body;
  const nous = vform(v.inf, "present", "nous").body;
  const vous = vform(v.inf, "present", "vous").body;
  const irr = IMP_IRR[v.inf];
  const tuI = irr ? irr[0] : /(es|as)$/.test(tuP) ? tuP.slice(0, -1) : tuP;
  const answer = who === "tu" ? tuI : who === "nous" ? (irr ? irr[1] : nous) : irr ? irr[2] : vous;
  const to = who === "tu" ? "to a friend" : who === "nous" ? "let’s" : "to several people, or politely";
  return {
    before: "", after: " !", en: `(${v.inf} · ${v.en}) — ${to}`, options: opts(answer, [tuI, tuP, nous, vous]).map(cap), answer: cap(answer),
    explain: who === "tu" ? (tuI !== tuP ? `-er verbs (and verbs like ouvrir) drop the -s in the tu imperative: ${tuI} !` : `The tu imperative is the present form without tu: ${tuI} !`) : `The ${who} imperative is the present form without the pronoun: ${answer} !`,
  };
}

// Direct objects: [verb, object, pronoun]
const COD: [string, string, "le" | "la" | "les"][] = [
  ["regarder", "la télé", "la"], ["prendre", "le bus", "le"], ["acheter", "les billets", "les"], ["lire", "le journal", "le"], ["faire", "la vaisselle", "la"], ["inviter", "tes amis", "les"],
  ["appeler", "ta mère", "la"], ["attendre", "le train", "le"], ["chercher", "tes clés", "les"], ["oublier", "ton parapluie", "le"], ["finir", "le rapport", "le"], ["boire", "le café", "le"],
  ["manger", "la soupe", "la"], ["écouter", "la radio", "la"], ["ouvrir", "la fenêtre", "la"], ["fermer", "la porte", "la"], ["aider", "ton frère", "le"], ["préparer", "le dîner", "le"],
  ["envoyer", "la lettre", "la"], ["laver", "la voiture", "la"], ["porter", "les valises", "les"], ["réserver", "les chambres", "les"], ["visiter", "le musée", "le"], ["utiliser", "l’ordinateur", "le"],
  ["écrire", "le message", "le"], ["apprendre", "le français", "le"], ["choisir", "la robe", "la"], ["vendre", "la maison", "la"], ["aimer", "le chocolat", "le"], ["connaître", "Marie", "la"],
  ["voir", "les enfants", "les"], ["comprendre", "la question", "la"], ["payer", "l’addition", "la"], ["ranger", "ta chambre", "la"], ["nettoyer", "la cuisine", "la"], ["garder", "les photos", "les"],
  ["adorer", "ces chaussures", "les"], ["essayer", "ce pull", "le"],
];
const QA: [string, string][] = [["tu", "je"], ["tu", "je"], ["vous", "nous"], ["il", "il"], ["elle", "elle"]];
function possFix(obj: string, q: string) {
  if (q === "vous") return obj.replace(/^ton |^ta /, "votre ").replace(/^tes /, "vos ");
  if (q === "il" || q === "elle") return obj.replace(/^ton /, "son ").replace(/^ta /, "sa ").replace(/^tes /, "ses ");
  return obj;
}
function directPronouns(): Item {
  const [inf, obj0, pron] = pick(COD);
  const [q, a] = pick(QA);
  const obj = possFix(obj0, q);
  const Q = vform(inf, "present", q);
  const A = vform(inf, "present", a).body;
  const neg = Math.random() < 0.3;
  const answer = pron !== "les" && vowelStart(A) ? "l’" : pron;
  const el = answer === "l’";
  return {
    before: `${cap(Q.pre)}${Q.body} ${obj} ? — ${neg ? "Non" : "Oui"}, ${a} ${neg ? "ne " : ""}`, after: (el ? "" : " ") + A + (neg ? " pas." : "."), en: `Replace « ${obj} » with a pronoun.`,
    options: el ? ["l’", "le", "la", "les"] : ["le", "la", "les", "lui"], answer,
    explain: `${obj} is ${pron === "les" ? "plural" : pron === "le" ? "masculine" : "feminine"} → ${pron}${el ? ", which becomes l’ before a vowel" : ""}. It goes before the verb.`,
  };
}

const COI_VERBS = ["parler", "téléphoner", "écrire", "répondre", "sourire", "mentir", "obéir", "ressembler"];
const RECIP: [string, boolean][] = [["à ta mère", false], ["à Paul", false], ["à ton professeur", false], ["à ta sœur", false], ["au directeur", false], ["à la voisine", false], ["à tes parents", true], ["à tes amis", true], ["aux enfants", true], ["à tes collègues", true], ["aux clients", true], ["à tes grands-parents", true]];
function indirectPronouns(): Item {
  const inf = pick(COI_VERBS);
  const [r0, pl] = pick(RECIP);
  const [q, a] = pick(QA);
  const r = r0.replace(/^à ta /, q === "vous" ? "à votre " : q === "tu" ? "à ta " : "à sa ").replace(/^à ton /, q === "vous" ? "à votre " : q === "tu" ? "à ton " : "à son ").replace(/^à tes /, q === "vous" ? "à vos " : q === "tu" ? "à tes " : "à ses ");
  const Q = vform(inf, "present", q);
  const A = vform(inf, "present", a).body;
  const neg = Math.random() < 0.3;
  const answer = pl ? "leur" : "lui";
  return {
    before: `${cap(Q.pre)}${Q.body} ${r} ? — ${neg ? "Non" : "Oui"}, ${a} ${neg ? "ne " : ""}`, after: ` ${A}${neg ? " pas" : ""}.`, en: `Replace « ${r} » with a pronoun.`,
    options: ["lui", "leur", "le", "les"], answer, explain: `${inf} à + ${pl ? "several people → leur" : "one person → lui"}.`,
  };
}

// ════════════════════════ B1 ════════════════════════

const ADVERBS: [string, string, string, string][] = [
  ["lent", "lente", "lentement", "slowly"], ["rapide", "rapide", "rapidement", "quickly"], ["doux", "douce", "doucement", "gently"], ["heureux", "heureuse", "heureusement", "fortunately"],
  ["sérieux", "sérieuse", "sérieusement", "seriously"], ["facile", "facile", "facilement", "easily"], ["probable", "probable", "probablement", "probably"], ["vrai", "vraie", "vraiment", "really"],
  ["poli", "polie", "poliment", "politely"], ["absolu", "absolue", "absolument", "absolutely"], ["évident", "évidente", "évidemment", "obviously"], ["prudent", "prudente", "prudemment", "carefully"],
  ["patient", "patiente", "patiemment", "patiently"], ["récent", "récente", "récemment", "recently"], ["fréquent", "fréquente", "fréquemment", "frequently"], ["constant", "constante", "constamment", "constantly"],
  ["courant", "courante", "couramment", "fluently"], ["bruyant", "bruyante", "bruyamment", "noisily"], ["gentil", "gentille", "gentiment", "kindly"], ["bref", "brève", "brièvement", "briefly"],
  ["précis", "précise", "précisément", "precisely"], ["énorme", "énorme", "énormément", "enormously"], ["profond", "profonde", "profondément", "deeply"], ["régulier", "régulière", "régulièrement", "regularly"],
  ["certain", "certaine", "certainement", "certainly"], ["seul", "seule", "seulement", "only"], ["libre", "libre", "librement", "freely"], ["calme", "calme", "calmement", "calmly"],
  ["clair", "claire", "clairement", "clearly"], ["simple", "simple", "simplement", "simply"], ["naturel", "naturelle", "naturellement", "naturally"], ["final", "finale", "finalement", "finally"],
  ["général", "générale", "généralement", "generally"], ["actif", "active", "activement", "actively"], ["franc", "franche", "franchement", "frankly"], ["tranquille", "tranquille", "tranquillement", "quietly"],
  ["complet", "complète", "complètement", "completely"], ["discret", "discrète", "discrètement", "discreetly"], ["dangereux", "dangereuse", "dangereusement", "dangerously"], ["parfait", "parfaite", "parfaitement", "perfectly"],
];
function adverbs(): Item {
  const [m, f, adv, en] = pick(ADVERBS);
  const wrongs = [f + "ment", m + "ment", m + "ement", m.replace(/ant$/, "emment"), m.replace(/ent$/, "amment"), m.replace(/ent$/, "ement"), m.replace(/ant$/, "antement")];
  return {
    before: `${m} → `, after: "", en, options: opts(adv, wrongs), answer: adv,
    explain: /amment$|emment$/.test(adv) ? `-ant → -amment, -ent → -emment: ${adv}.` : /[aeiouéiu]$/.test(m) && adv === m + "ment" ? `${m} ends in a vowel: add -ment to the masculine.` : adv === f + "ment" ? `Feminine (${f}) + -ment.` : `Irregular: ${adv}.`,
  };
}

function demonstrativePronouns(): Item {
  const { n, pl } = nounPick(0.3);
  const dem = pl ? "ces" : n.g === "f" ? "cette" : elides(n.fr) ? "cet" : "ce";
  const answer = pl ? (n.g === "m" ? "ceux" : "celles") : n.g === "m" ? "celui" : "celle";
  const who = pick(NAMES)[0];
  return {
    before: `Tu préfères ${dem} ${pl ? plural(n) : n.fr} ou `, after: ` de ${who} ?`, en: `Do you prefer ${pl ? "these" : "this"} ${enOf(n, pl)} or ${who}’s?`,
    options: ["celui", "celle", "ceux", "celles"], answer, explain: `${pl ? plural(n) : n.fr} is ${genderWord(n.g, pl)}: ${answer}.`,
  };
}

const POSS_P: [string, string, string][] = [["moi", "mien", "mine"], ["toi", "tien", "yours"], ["lui", "sien", "his"], ["elle", "sien", "hers"], ["nous", "nôtre", "ours"], ["vous", "vôtre", "yours (vous)"], ["eux", "leur", "theirs"]];
function possForms(base: string): [string, string, string, string] {
  if (base === "nôtre" || base === "vôtre") return [`le ${base}`, `la ${base}`, `les ${base}s`, `les ${base}s`];
  if (base === "leur") return ["le leur", "la leur", "les leurs", "les leurs"];
  return [`le ${base}`, `la ${base}ne`, `les ${base}s`, `les ${base}nes`];
}
function possessivePronouns(): Item {
  const { n, pl } = nounPick(0.3);
  const [who, base, en] = pick(POSS_P);
  const f = possForms(base);
  const answer = pl ? (n.g === "m" ? f[2] : f[3]) : n.g === "m" ? f[0] : f[1];
  const dem = pl ? "Ces" : n.g === "f" ? "Cette" : elides(n.fr) ? "Cet" : "Ce";
  return {
    before: `${dem} ${pl ? plural(n) : n.fr} ${pl ? "sont" : "est"} à ${who}. ${pl ? "Ce sont" : "C’est"} `, after: ".", en: `(${en})`,
    options: opts(answer, [...f, ...possForms(pick(POSS_P.filter((p) => p[1] !== base))[1])]), answer,
    explain: `It agrees with ${pl ? plural(n) : n.fr} (${genderWord(n.g, pl)}): ${answer}.`,
  };
}

const DBL_VERBS = ["prêter", "donner", "envoyer", "montrer", "offrir", "rendre"];
const DBL_OBJ: [string, "le" | "la" | "les"][] = [["ton vélo", "le"], ["ta voiture", "la"], ["tes notes", "les"], ["le livre", "le"], ["la photo", "la"], ["les clés", "les"], ["ton adresse", "la"], ["le message", "le"], ["les photos", "les"], ["ta recette", "la"]];
const DBL_REC: [string, "lui" | "leur"][] = [["à Paul", "lui"], ["à ta sœur", "lui"], ["à tes parents", "leur"], ["aux enfants", "leur"], ["à la voisine", "lui"]];
function doublePronouns(): Item {
  const inf = pick(DBL_VERBS);
  const [obj, pron] = pick(DBL_OBJ);
  const Q = vform(inf, "present", "tu").body;
  const A = vform(inf, "present", "je").body;
  if (Math.random() < 0.55) {
    const [rec, ind] = pick(DBL_REC);
    const answer = `${pron} ${ind}`;
    const otherInd = ind === "lui" ? "leur" : "lui";
    return {
      before: `Tu ${Q} ${obj} ${rec} ? — Oui, je `, after: ` ${A}.`, en: `Replace « ${obj} » and « ${rec} ».`,
      options: opts(answer, [`${ind} ${pron}`, `${pron} ${otherInd}`, `${otherInd} ${pron}`]), answer,
      explain: `Order: le / la / les before lui / leur → ${answer}.`,
    };
  }
  const el = pron !== "les" && vowelStart(A);
  const p2 = el ? "l’" : pron;
  const answer = `te ${p2}`;
  return {
    before: `Tu ${vowelStart(Q) ? "m’" : "me "}${Q} ${obj} ? — Oui, je `, after: (el ? "" : " ") + A + ".", en: `Replace « me » and « ${obj} ».`,
    options: opts(answer, [`${pron} te`, `me ${p2}`, `te lui`, `${pron} me`]), answer,
    explain: `Order: me / te / nous / vous before le / la / les → je ${answer}${el ? "" : " "}${A}.`,
  };
}

function pronominalPc(): Item {
  const [inf, en] = pick(PRONOMINAL.filter(([i]) => !["s’asseoir", "s’occuper", "s’intéresser", "s’habituer", "se sentir"].includes(i)));
  const pp = conjugate(inf).forms.passe[2].split(" ").pop()!.replace(/\(e\)s?$/, "");
  const [S, g, pl] = pick(PEOPLE_SUBJ);
  const answer = agree(pp, g, pl);
  return {
    before: `${S} ${pl ? "se sont" : "s’est"} `, after: " hier.", en: `(${inf} · ${en})`, options: shuffle(agreeForms(pp)), answer,
    explain: `Reflexive verbs use être, and the participle agrees with the subject (${genderWord(g, pl)}): ${answer}.`,
  };
}

const SUBJ3: [string, G, boolean][] = [["il", "m", false], ["elle", "f", false], ["nous", "m", true], ["vous", "m", true], ["ils", "m", true], ["elles", "f", true]];
const AUX: Record<"imparfait" | "futur" | "conditionnel" | "present", { avoir: string[]; etre: string[] }> = {
  present: { avoir: ["ai", "as", "a", "avons", "avez", "ont"], etre: ["suis", "es", "est", "sommes", "êtes", "sont"] },
  imparfait: { avoir: ["avais", "avais", "avait", "avions", "aviez", "avaient"], etre: ["étais", "étais", "était", "étions", "étiez", "étaient"] },
  futur: { avoir: ["aurai", "auras", "aura", "aurons", "aurez", "auront"], etre: ["serai", "seras", "sera", "serons", "serez", "seront"] },
  conditionnel: { avoir: ["aurais", "aurais", "aurait", "aurions", "auriez", "auraient"], etre: ["serais", "serais", "serait", "serions", "seriez", "seraient"] },
};
function compound(v: V, t: keyof typeof AUX, s: [string, G, boolean], forceAux?: "avoir" | "etre") {
  const useEtre = forceAux ? forceAux === "etre" : v.etre;
  const aux = AUX[t][useEtre ? "etre" : "avoir"][IDX[s[0]]];
  return `${aux} ${useEtre ? agree(v.pp, s[1], s[2]) : v.pp}`;
}
function compoundItem(t: "imparfait" | "futur" | "conditionnel", cues: string[], name: string, rule: string, simple: Tense): Item {
  const v = pickVerb();
  const s = pick(SUBJ3);
  const answer = compound(v, t, s);
  const wrongs = [compound(v, t, s, v.etre ? "avoir" : "etre"), compound(v, "present", s), vform(v.inf, simple, s[0]).body];
  const cue = pick(cues);
  return {
    before: joinElide(cue, s[0]) + " ", after: ".", en: `(${v.inf} · ${v.en})`, options: opts(answer, wrongs), answer,
    explain: `${name}: ${rule} ${v.etre ? "être" : "avoir"} + participle${v.etre ? " (agreeing with the subject)" : ""} → ${answer}.`,
  };
}
const plusQueParfait = () => compoundItem("imparfait", ["Quand nous sommes arrivés, ", "On m’a dit que ", "Le matin, j’ai vu que ", "Je savais que "], "Plus-que-parfait", "imparfait of", "imparfait");
const futurAnterieur = () => compoundItem("futur", ["Quand tu rentreras, ", "Demain à midi, ", "Dans une heure, ", "Avant ce soir, "], "Futur antérieur", "futur of", "futur");

const COND_SI: [string, string][] = [
  ["il fait beau", "il faisait beau"], ["j’ai le temps", "j’avais le temps"], ["tu viens", "tu venais"], ["nous gagnons", "nous gagnions"], ["il pleut", "il pleuvait"],
  ["vous êtes libres", "vous étiez libres"], ["elle a de l’argent", "elle avait de l’argent"], ["ils peuvent", "ils pouvaient"], ["on part tôt", "on partait tôt"],
  ["je suis en vacances", "j’étais en vacances"], ["tu m’aides", "tu m’aidais"], ["le train est à l’heure", "le train était à l’heure"],
];
function siClauses(): Item {
  const [pres, imp] = pick(COND_SI);
  const real = Math.random() < 0.5;
  const v = pickVerb();
  const subj = pick(SUBJ_ALL);
  const t: Tense = real ? "futur" : "conditionnel";
  const { pre, body } = vform(v.inf, t, subj);
  const wrongs = (["futur", "conditionnel", "present", "imparfait"] as Tense[]).map((x) => vform(v.inf, x, subj).body);
  return {
    before: `${joinElide("Si ", real ? pres : imp)}, ${pre}`, after: ".", en: `(${v.inf} · ${v.en})`, options: opts(body, wrongs), answer: body,
    explain: real ? "Si + présent → futur." : "Si + imparfait → conditionnel.",
  };
}

const COND_PQP = ["il avait fait beau", "j’avais su", "tu étais venu", "nous avions gagné", "il avait plu", "vous m’aviez écouté", "elle avait eu le temps", "ils étaient partis plus tôt", "j’avais pris le train", "tu m’avais appelé"];
function conditionnelPasse(): Item {
  const cond = pick(COND_PQP);
  const v = pickVerb();
  const s = pick(SUBJ3);
  const answer = compound(v, "conditionnel", s);
  const wrongs = [compound(v, "conditionnel", s, v.etre ? "avoir" : "etre"), compound(v, "futur", s), vform(v.inf, "conditionnel", s[0]).body, compound(v, "imparfait", s)];
  return {
    before: `${joinElide("Si ", cond)}, ${s[0]} `, after: ".", en: `(${v.inf} · ${v.en})`, options: opts(answer, wrongs), answer,
    explain: `Si + plus-que-parfait → conditionnel passé: ${v.etre ? "être" : "avoir"} in the conditionnel + participle → ${answer}.`,
  };
}

const GER_MAIN: [string, string][] = [["Elle chante ", "She sings while"], ["Il s’est blessé ", "He hurt himself while"], ["J’écoute de la musique ", "I listen to music while"], ["On apprend beaucoup ", "You learn a lot by"], ["Je me suis endormie ", "I fell asleep while"], ["Il sourit ", "He smiles while"]];
const GER_IRR: Record<string, string> = { être: "étant", avoir: "ayant", savoir: "sachant" };
function gerondif(): Item {
  const v = pickVerb();
  const [lead, enLead] = pick(GER_MAIN);
  const nous = vform(v.inf, "present", "nous").body;
  const part = GER_IRR[v.inf] ?? nous.replace(/ons$/, "ant");
  const answer = `en ${part}`;
  return {
    before: lead, after: ".", en: `${enLead} … (${v.inf} · ${v.en})`, options: opts(answer, [`en ${v.inf}`, `en ${v.pp}`, `en ${nous}`]), answer,
    explain: `nous ${nous} → ${part}. Gérondif = en + present participle.`,
  };
}

// Verbs followed by à / de / nothing before an infinitive
const VP: [string, "à" | "de" | "—"][] = [
  ...["commencer", "apprendre", "réussir", "continuer", "hésiter", "s’habituer", "chercher", "se mettre", "renoncer", "tenir"].map((v) => [v, "à"] as [string, "à"]),
  ...["décider", "arrêter", "essayer", "oublier", "refuser", "finir", "choisir", "accepter", "rêver", "éviter", "regretter", "promettre", "risquer", "mériter", "cesser", "se dépêcher", "tenter"].map((v) => [v, "de"] as [string, "de"]),
  ...["vouloir", "pouvoir", "devoir", "savoir", "aimer", "adorer", "détester", "préférer", "espérer", "aller", "compter", "oser"].map((v) => [v, "—"] as [string, "—"]),
];
const INFS: [string, string][] = [
  ["partir", "leave"], ["travailler", "work"], ["nager", "swim"], ["cuisiner", "cook"], ["conduire", "drive"], ["lire en français", "read in French"], ["jouer du piano", "play the piano"],
  ["parler en public", "speak in public"], ["étudier", "study"], ["chanter", "sing"], ["danser", "dance"], ["courir", "run"], ["écrire un livre", "write a book"], ["fumer", "smoke"],
  ["voyager seule", "travel alone"], ["arriver à l’heure", "arrive on time"], ["économiser", "save money"], ["changer de travail", "change jobs"], ["répondre", "answer"], ["apprendre le japonais", "learn Japanese"],
];
function verbPrepositions(): Item {
  const [main, prep] = pick(VP);
  let [inf, enI] = pick(INFS);
  if (inf.startsWith(main)) [inf, enI] = INFS[0];
  const subj = pick(SUBJ_ALL);
  const { pre, body } = vform(main, "present", subj);
  const d = vowelStart(inf) ? "d’" : "de";
  const answer = prep === "de" ? d : prep;
  return {
    before: `${cap(pre)}${body} `, after: (answer === "d’" ? "" : " ") + inf + ".", en: `(${main} + ${enI})`, options: ["à", d, "—"], answer,
    explain: prep === "—" ? `${main} is followed directly by the infinitive, with no preposition.` : `${main} ${prep} + infinitive${answer === "d’" ? " (de → d’ before a vowel)" : ""}.`,
  };
}

// ════════════════════════ B2 ════════════════════════

const PS: [string, string, string][] = [
  ["être", "fut", "furent"], ["avoir", "eut", "eurent"], ["faire", "fit", "firent"], ["aller", "alla", "allèrent"], ["venir", "vint", "vinrent"], ["prendre", "prit", "prirent"],
  ["voir", "vit", "virent"], ["dire", "dit", "dirent"], ["mettre", "mit", "mirent"], ["pouvoir", "put", "purent"], ["vouloir", "voulut", "voulurent"], ["savoir", "sut", "surent"],
  ["naître", "naquit", "naquirent"], ["mourir", "mourut", "moururent"], ["vivre", "vécut", "vécurent"], ["écrire", "écrivit", "écrivirent"], ["lire", "lut", "lurent"], ["tenir", "tint", "tinrent"],
  ["devoir", "dut", "durent"], ["croire", "crut", "crurent"], ["parler", "parla", "parlèrent"], ["finir", "finit", "finirent"], ["répondre", "répondit", "répondirent"], ["partir", "partit", "partirent"],
  ["recevoir", "reçut", "reçurent"], ["connaître", "connut", "connurent"], ["boire", "but", "burent"], ["ouvrir", "ouvrit", "ouvrirent"], ["entendre", "entendit", "entendirent"], ["courir", "courut", "coururent"],
  ["entrer", "entra", "entrèrent"], ["regarder", "regarda", "regardèrent"], ["comprendre", "comprit", "comprirent"], ["devenir", "devint", "devinrent"],
];
function passeSimple(): Item {
  const [inf, il, ils] = pick(PS);
  const pl = Math.random() < 0.4;
  const s = pl ? pick(["ils", "elles"]) : pick(["il", "elle"]);
  const answer = pl ? ils : il;
  const wrongs = [pl ? il : ils, vform(inf, "present", s).body, vform(inf, "imparfait", s).body, vform(inf, "futur", s).body];
  return {
    before: `${pick(["Ce jour-là, ", "Soudain, ", "Alors, ", "Puis "])}${s} `, after: "…", en: `(${inf} · passé simple)`, options: opts(answer, wrongs), answer,
    explain: `Passé simple of ${inf}: il ${il}, ils ${ils}.`,
  };
}


// ════════════════════════ mixed articles challenge ════════════════════════
// The sentence and its English translation decide which article is needed; 6 options from every article family.
const ALL_ART = ["le", "la", "l’", "les", "un", "une", "des", "du", "de la", "de l’", "de", "d’", "au", "à la", "à l’", "aux"];
function defArt(g: G, pl: boolean, el: boolean) { return pl ? "les" : el ? "l’" : g === "m" ? "le" : "la"; }
function articlesMix(): Item {
  const kind = pick(["likes", "def", "indef", "part", "a", "de", "neg", "negdef", "likes", "part", "indef"]);
  let noun: string, g: G, pl = false, en = "", answer = "", explain = "", before = "", after = "";
  const useMass = kind === "part" || kind === "negdef" || (kind === "likes" && Math.random() < 0.5) || (kind === "neg" && Math.random() < 0.4);
  if (useMass) {
    const m = pick(MASS);
    noun = m[0];
    pl = m[1] === "pl";
    g = pl ? "m" : (m[1] as G);
    en = m[2];
  } else {
    const r = nounPick(kind === "likes" ? 1 : kind === "def" || kind === "a" || kind === "de" ? 0.3 : kind === "indef" ? 0.35 : 0);
    noun = r.pl ? plural(r.n) : r.n.fr;
    g = r.n.g;
    pl = r.pl;
    en = enOf(r.n, r.pl);
  }
  const el = !pl && elides(noun);
  const d = defArt(g, pl, el);
  switch (kind) {
    case "likes":
      before = "J’aime ";
      answer = d;
      en = `I like ${en}.`;
      explain = `Likes and dislikes use the definite article for things in general: ${d}${el ? "" : " "}${noun}.`;
      break;
    case "def":
      before = "";
      after = ` ${pl ? "sont" : "est"} sur la table.`;
      answer = cap(d);
      en = `The ${en} ${pl ? "are" : "is"} on the table.`;
      explain = `A specific, known thing: the definite article ${d}.`;
      break;
    case "indef":
      before = "Il y a ";
      after = " dans la rue.";
      answer = pl ? "des" : g === "m" ? "un" : "une";
      en = pl ? `There are some ${en} in the street.` : `There’s ${/^[aeiou]/.test(en) ? "an" : "a"} ${en} in the street.`;
      explain = `Something not specific that you can count: ${answer}.`;
      break;
    case "part":
      before = "Je voudrais ";
      answer = pl ? "des" : el ? "de l’" : g === "m" ? "du" : "de la";
      en = `I’d like some ${en}.`;
      explain = `An amount of something you don’t count: the partitive ${answer}.`;
      break;
    case "a":
      before = "Je pense souvent ";
      answer = pl ? "aux" : el ? "à l’" : g === "m" ? "au" : "à la";
      en = `I often think about the ${en}.`;
      explain = `Penser à + ${d}: ${pl ? "à + les = aux" : el ? "à l’, no contraction" : g === "m" ? "à + le = au" : "à la, no contraction"}.`;
      break;
    case "de":
      before = "On parle ";
      answer = pl ? "des" : el ? "de l’" : g === "m" ? "du" : "de la";
      en = `We’re talking about the ${en}.`;
      explain = `Parler de + ${d}: ${pl ? "de + les = des" : el ? "de l’, no contraction" : g === "m" ? "de + le = du" : "de la, no contraction"}.`;
      break;
    case "neg":
      before = useMass ? "Il n’y a pas " : "Je n’ai pas ";
      answer = elides(noun) ? "d’" : "de";
      en = useMass ? `There’s no ${en}.` : `I don’t have ${pl ? "any" : /^[aeiou]/.test(en) ? "an" : "a"} ${en}.`;
      explain = `After a negation, un, une, des and the partitive become ${answer}.`;
      break;
    case "negdef":
      before = "Je n’aime pas ";
      answer = d;
      en = `I don’t like ${en}.`;
      explain = `Careful: with aimer, the definite article stays after a negation: je n’aime pas ${d}${el ? "" : " "}${noun}.`;
      break;
  }
  after = after || ".";
  const nounPart = (answer.endsWith("’") ? "" : " ") + noun;
  const vowel = elides(noun);
  const pool = ALL_ART.filter((a) => (vowel ? true : !a.endsWith("’"))).map((a) => (before === "" ? cap(a) : a));
  return { before, after: nounPart + after, en, options: opts(answer, pool, 6), answer, explain };
}

// ════════════════════════ hand-written banks ════════════════════════

const bankQueues: Record<string, BankItem[]> = {};
function fromBank(id: string): Item {
  if (!bankQueues[id]?.length) bankQueues[id] = shuffle(BANKS[id]);
  const [s, answer, wrongs, en, explain] = bankQueues[id].pop()!;
  const [before, after0] = s.split("___");
  const after = answer.endsWith("’") ? after0.replace(/^ /, "") : after0;
  return { before, after, en, options: shuffle([answer, ...wrongs]), answer, explain };
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
  "plural-nouns": pluralNouns,
  possessives,
  demonstratives,
  "adjective-agreement": adjectiveAgreement,
  "present-er": () => presentForms("er"),
  "present-ir-re": () => presentForms("ir-re"),
  "futur-proche": futurProche,
  negation,
  quel,
  "stressed-pronouns": stressedPronouns,
  places,
  "adjective-position": adjectivePosition,
  comparatives,
  superlatives,
  tout,
  "past-participles": pastParticiples,
  "pc-agreement": pcAgreement,
  "imparfait-forms": imparfaitForms,
  "futur-simple": futurSimple,
  "passe-recent": passeRecent,
  reflexive,
  imperative,
  "direct-pronouns": directPronouns,
  "indirect-pronouns": indirectPronouns,
  "adverbs-ment": adverbs,
  "demonstrative-pronouns": demonstrativePronouns,
  "possessive-pronouns": possessivePronouns,
  "double-pronouns": doublePronouns,
  "pronominal-pc": pronominalPc,
  "plus-que-parfait": plusQueParfait,
  conditionnel,
  "si-clauses": siClauses,
  subjonctif,
  gerondif,
  "verb-prepositions": verbPrepositions,
  "futur-anterieur": futurAnterieur,
  "conditionnel-passe": conditionnelPasse,
  "passe-simple": passeSimple,
  "articles-mix": articlesMix,
};
for (const id of Object.keys(BANKS)) GEN[id] = () => fromBank(id);

export const hasGenerator = (id: string) => id in GEN;

export function nextItem(ruleId: string, prev?: Item): Item {
  const g = GEN[ruleId] ?? definite;
  for (let i = 0; i < 6; i++) {
    const it = g();
    if (!prev || it.before + it.after + (it.prompt ?? "") !== prev.before + prev.after + (prev.prompt ?? "")) return it;
  }
  return g();
}
