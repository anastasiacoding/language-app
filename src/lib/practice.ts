// Endless exercise generators for each grammar rule. Everything is built locally from word lists.
import { NOUNS, NOUN_MAP, elides, plural, addHMuet, type G, type Noun } from "../data/nouns";
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
  const p = pick(PLACES);
  const n = NOUN_MAP.get(p.fr);
  const withDe = Math.random() < 0.45;
  const el = !p.pl && elides(p.fr);
  const g = n?.g ?? "m";
  const answer = withDe ? (p.pl ? "des" : el ? "de l’" : g === "m" ? "du" : "de la") : p.pl ? "aux" : el ? "à l’" : g === "m" ? "au" : "à la";
  const place = n ? en1(n.en) : p.en ?? p.fr;
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
