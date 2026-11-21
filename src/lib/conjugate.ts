// A small French conjugator: regular -er/-ir/-re verbs, common spelling changes,
// and a table of frequent irregular verbs (with prefixed families like com-prendre, de-venir).

export type Tense = "present" | "passe" | "imparfait" | "futur" | "conditionnel" | "subjonctif";
export const TENSES: { id: Tense; label: string }[] = [
  { id: "present", label: "Présent" },
  { id: "passe", label: "Passé composé" },
  { id: "imparfait", label: "Imparfait" },
  { id: "futur", label: "Futur simple" },
  { id: "conditionnel", label: "Conditionnel" },
  { id: "subjonctif", label: "Subjonctif" },
];
export const PRONOUNS = ["je", "tu", "il / elle", "nous", "vous", "ils / elles"];

interface Irr {
  present: string[];
  pp: string;
  etre?: boolean;
  fut?: string;
  subj?: string[];
  imp?: string; // imparfait stem override
  en: string;
}

const I: Record<string, Irr> = {
  être: { present: ["suis", "es", "est", "sommes", "êtes", "sont"], pp: "été", fut: "ser", imp: "ét", subj: ["sois", "sois", "soit", "soyons", "soyez", "soient"], en: "to be" },
  avoir: { present: ["ai", "as", "a", "avons", "avez", "ont"], pp: "eu", fut: "aur", subj: ["aie", "aies", "ait", "ayons", "ayez", "aient"], en: "to have" },
  aller: { present: ["vais", "vas", "va", "allons", "allez", "vont"], pp: "allé", etre: true, fut: "ir", subj: ["aille", "ailles", "aille", "allions", "alliez", "aillent"], en: "to go" },
  faire: { present: ["fais", "fais", "fait", "faisons", "faites", "font"], pp: "fait", fut: "fer", subj: ["fasse", "fasses", "fasse", "fassions", "fassiez", "fassent"], en: "to do, to make" },
  pouvoir: { present: ["peux", "peux", "peut", "pouvons", "pouvez", "peuvent"], pp: "pu", fut: "pourr", subj: ["puisse", "puisses", "puisse", "puissions", "puissiez", "puissent"], en: "can, to be able to" },
  vouloir: { present: ["veux", "veux", "veut", "voulons", "voulez", "veulent"], pp: "voulu", fut: "voudr", subj: ["veuille", "veuilles", "veuille", "voulions", "vouliez", "veuillent"], en: "to want" },
  devoir: { present: ["dois", "dois", "doit", "devons", "devez", "doivent"], pp: "dû", fut: "devr", en: "must, to have to" },
  savoir: { present: ["sais", "sais", "sait", "savons", "savez", "savent"], pp: "su", fut: "saur", subj: ["sache", "saches", "sache", "sachions", "sachiez", "sachent"], en: "to know" },
  venir: { present: ["viens", "viens", "vient", "venons", "venez", "viennent"], pp: "venu", etre: true, fut: "viendr", en: "to come" },
  tenir: { present: ["tiens", "tiens", "tient", "tenons", "tenez", "tiennent"], pp: "tenu", fut: "tiendr", en: "to hold" },
  prendre: { present: ["prends", "prends", "prend", "prenons", "prenez", "prennent"], pp: "pris", en: "to take" },
  mettre: { present: ["mets", "mets", "met", "mettons", "mettez", "mettent"], pp: "mis", en: "to put" },
  dire: { present: ["dis", "dis", "dit", "disons", "dites", "disent"], pp: "dit", en: "to say" },
  voir: { present: ["vois", "vois", "voit", "voyons", "voyez", "voient"], pp: "vu", fut: "verr", en: "to see" },
  croire: { present: ["crois", "crois", "croit", "croyons", "croyez", "croient"], pp: "cru", en: "to believe" },
  partir: { present: ["pars", "pars", "part", "partons", "partez", "partent"], pp: "parti", etre: true, en: "to leave" },
  sortir: { present: ["sors", "sors", "sort", "sortons", "sortez", "sortent"], pp: "sorti", etre: true, en: "to go out" },
  dormir: { present: ["dors", "dors", "dort", "dormons", "dormez", "dorment"], pp: "dormi", en: "to sleep" },
  sentir: { present: ["sens", "sens", "sent", "sentons", "sentez", "sentent"], pp: "senti", en: "to feel, to smell" },
  servir: { present: ["sers", "sers", "sert", "servons", "servez", "servent"], pp: "servi", en: "to serve" },
  mentir: { present: ["mens", "mens", "ment", "mentons", "mentez", "mentent"], pp: "menti", en: "to lie" },
  ouvrir: { present: ["ouvre", "ouvres", "ouvre", "ouvrons", "ouvrez", "ouvrent"], pp: "ouvert", en: "to open" },
  couvrir: { present: ["couvre", "couvres", "couvre", "couvrons", "couvrez", "couvrent"], pp: "couvert", en: "to cover" },
  offrir: { present: ["offre", "offres", "offre", "offrons", "offrez", "offrent"], pp: "offert", en: "to offer" },
  souffrir: { present: ["souffre", "souffres", "souffre", "souffrons", "souffrez", "souffrent"], pp: "souffert", en: "to suffer" },
  connaître: { present: ["connais", "connais", "connaît", "connaissons", "connaissez", "connaissent"], pp: "connu", en: "to know (a person, a place)" },
  paraître: { present: ["parais", "parais", "paraît", "paraissons", "paraissez", "paraissent"], pp: "paru", en: "to seem" },
  naître: { present: ["nais", "nais", "naît", "naissons", "naissez", "naissent"], pp: "né", etre: true, en: "to be born" },
  lire: { present: ["lis", "lis", "lit", "lisons", "lisez", "lisent"], pp: "lu", en: "to read" },
  écrire: { present: ["écris", "écris", "écrit", "écrivons", "écrivez", "écrivent"], pp: "écrit", en: "to write" },
  boire: { present: ["bois", "bois", "boit", "buvons", "buvez", "boivent"], pp: "bu", en: "to drink" },
  vivre: { present: ["vis", "vis", "vit", "vivons", "vivez", "vivent"], pp: "vécu", en: "to live" },
  suivre: { present: ["suis", "suis", "suit", "suivons", "suivez", "suivent"], pp: "suivi", en: "to follow" },
  recevoir: { present: ["reçois", "reçois", "reçoit", "recevons", "recevez", "reçoivent"], pp: "reçu", fut: "recevr", en: "to receive" },
  apercevoir: { present: ["aperçois", "aperçois", "aperçoit", "apercevons", "apercevez", "aperçoivent"], pp: "aperçu", fut: "apercevr", en: "to glimpse" },
  courir: { present: ["cours", "cours", "court", "courons", "courez", "courent"], pp: "couru", fut: "courr", en: "to run" },
  mourir: { present: ["meurs", "meurs", "meurt", "mourons", "mourez", "meurent"], pp: "mort", etre: true, fut: "mourr", en: "to die" },
  conduire: { present: ["conduis", "conduis", "conduit", "conduisons", "conduisez", "conduisent"], pp: "conduit", en: "to drive" },
  plaire: { present: ["plais", "plais", "plaît", "plaisons", "plaisez", "plaisent"], pp: "plu", en: "to please" },
  rire: { present: ["ris", "ris", "rit", "rions", "riez", "rient"], pp: "ri", en: "to laugh" },
  envoyer: { present: ["envoie", "envoies", "envoie", "envoyons", "envoyez", "envoient"], pp: "envoyé", fut: "enverr", en: "to send" },
  battre: { present: ["bats", "bats", "bat", "battons", "battez", "battent"], pp: "battu", en: "to beat" },
  falloir: { present: ["", "", "faut", "", "", ""], pp: "fallu", fut: "faudr", subj: ["", "", "faille", "", "", ""], imp: "fall", en: "to be necessary (il faut)" },
  pleuvoir: { present: ["", "", "pleut", "", "", ""], pp: "plu", fut: "pleuvr", imp: "pleuv", subj: ["", "", "pleuve", "", "", ""], en: "to rain (il pleut)" },
  valoir: { present: ["vaux", "vaux", "vaut", "valons", "valez", "valent"], pp: "valu", fut: "vaudr", subj: ["vaille", "vailles", "vaille", "valions", "valiez", "vaillent"], en: "to be worth" },
  prévoir: { present: ["prévois", "prévois", "prévoit", "prévoyons", "prévoyez", "prévoient"], pp: "prévu", fut: "prévoir", en: "to foresee, to plan" },
  asseoir: { present: ["assieds", "assieds", "assied", "asseyons", "asseyez", "asseyent"], pp: "assis", fut: "assiér", en: "to seat (s’asseoir: to sit down)" },
};

// Verb families conjugated like a base verb with a different stem
function indre(stem: string, en: string): Irr {
  // craindre: crain- -> crains, craignons
  const base = stem.slice(0, -1); // crai
  return { present: [stem + "s", stem + "s", stem + "t", base + "gnons", base + "gnez", base + "gnent"], pp: stem + "t", en };
}
function uire(stem: string, en: string): Irr {
  return { present: [stem + "s", stem + "s", stem + "t", stem + "sons", stem + "sez", stem + "sent"], pp: stem + "t", en };
}
Object.assign(I, {
  craindre: indre("crain", "to fear"),
  plaindre: indre("plain", "to pity"),
  peindre: indre("pein", "to paint"),
  éteindre: indre("étein", "to switch off"),
  atteindre: indre("attein", "to reach"),
  joindre: indre("join", "to join"),
  construire: uire("construi", "to build"),
  détruire: uire("détrui", "to destroy"),
  produire: uire("produi", "to produce"),
  traduire: uire("tradui", "to translate"),
  cuire: uire("cui", "to cook"),
});

const PREFIX_ETRE = new Set(["devenir", "revenir", "parvenir", "intervenir", "redevenir", "repartir", "ressortir", "renaître"]);
const PREFIX_AVOIR = new Set(["prévenir", "convenir", "subvenir"]);
const EN_EXTRA: Record<string, string> = {
  comprendre: "to understand", apprendre: "to learn", surprendre: "to surprise", reprendre: "to take back",
  devenir: "to become", revenir: "to come back", souvenir: "to remember (se souvenir)", prévenir: "to warn",
  obtenir: "to obtain", retenir: "to hold back", maintenir: "to maintain", appartenir: "to belong", contenir: "to contain",
  permettre: "to allow", promettre: "to promise", admettre: "to admit", remettre: "to put back", soumettre: "to submit",
  revoir: "to see again", décrire: "to describe", inscrire: "to register", découvrir: "to discover", reconnaître: "to recognize",
  disparaître: "to disappear", apparaître: "to appear", poursuivre: "to pursue", survivre: "to survive", sourire: "to smile",
  ressentir: "to feel", repartir: "to leave again", ressortir: "to go out again", combattre: "to fight", décevoir: "to disappoint",
};

function findIrregular(inf: string): { prefix: string; base: string; irr: Irr } | null {
  if (I[inf]) return { prefix: "", base: inf, irr: I[inf] };
  // longest base that is a suffix of the infinitive (com+prendre, dé+couvrir, re+connaître)
  const bases = Object.keys(I).sort((a, b) => b.length - a.length);
  for (const b of bases) {
    if (inf.length > b.length && inf.endsWith(b) && b.length >= 4) {
      if (b === "dire" && !["redire", "contredire", "prédire", "interdire"].includes(inf)) continue;
      if (b === "rire" && !["sourire"].includes(inf)) continue;
      if (b === "lire" && !["relire", "élire"].includes(inf)) continue;
      if (b === "voir" && ["prévoir", "pourvoir", "devoir", "recevoir", "apercevoir", "valoir"].includes(inf)) continue;
      return { prefix: inf.slice(0, -b.length), base: b, irr: I[b] };
    }
  }
  return null;
}

const ER_DOUBLE = new Set(["appeler", "rappeler", "jeter", "rejeter", "projeter", "épeler", "renouveler", "feuilleter", "ficeler", "interpeller"]);

function erPresent(inf: string): string[] {
  const st = inf.slice(0, -2);
  const end = ["e", "es", "e", "ons", "ez", "ent"];
  return end.map((e, i) => erForm(inf, st, e, i === 3 || i === 4 ? "soft" : "mute"));
}

/** Applies -er spelling changes. kind: "mute" = ending with silent e (je, tu, il, ils), "soft" = ending starts with a/o/i. */
function erForm(inf: string, st: string, ending: string, kind: "mute" | "soft") {
  let s = st;
  if (kind === "mute") {
    if (ER_DOUBLE.has(inf)) s = s.replace(/(l|t)$/, "$1$1");
    else if (/e[bcdfghjklmnpqrstvz]$/.test(s) && /e[bcdfghjklmnpqrstvz]er$/.test(inf)) s = s.replace(/e([bcdfghjklmnpqrstvz])$/, "è$1");
    else if (/é([bcdfghjklmnpqrstvz]|[bcdfgptv][rl]|ch|gu|qu)$/.test(s)) s = s.replace(/é(?=([bcdfghjklmnpqrstvz]|[bcdfgptv][rl]|ch|gu|qu)$)/, "è");
    if (/(o|u)y$/.test(s)) s = s.slice(0, -1) + "i";
    if (/ay$/.test(s)) s = s.slice(0, -1) + "i";
  }
  if (/^[ao]/.test(ending)) {
    if (s.endsWith("g")) s += "e";
    if (s.endsWith("c")) s = s.slice(0, -1) + "ç";
  }
  return s + ending;
}

function regularPresent(inf: string): string[] | null {
  if (inf.endsWith("er")) return erPresent(inf);
  if (inf.endsWith("ir")) {
    const st = inf.slice(0, -2);
    return [st + "is", st + "is", st + "it", st + "issons", st + "issez", st + "issent"];
  }
  if (inf.endsWith("re")) {
    const st = inf.slice(0, -2);
    return [st + "s", st + "s", st, st + "ons", st + "ez", st + "ent"];
  }
  return null;
}

function regularPP(inf: string) {
  if (inf.endsWith("er")) return inf.slice(0, -2) + "é";
  if (inf.endsWith("ir")) return inf.slice(0, -2) + "i";
  if (inf.endsWith("re")) return inf.slice(0, -2) + "u";
  return inf;
}

function futureStem(inf: string): string {
  if (inf.endsWith("er")) {
    let st = inf.slice(0, -2);
    // j'appellerai, je lèverai, je nettoierai; préférer keeps é (je préférerai)
    if (ER_DOUBLE.has(inf)) st = st.replace(/(l|t)$/, "$1$1");
    else if (/e[bcdfghjklmnpqrstvz]$/.test(st)) st = st.replace(/e([bcdfghjklmnpqrstvz])$/, "è$1");
    if (/(o|u|a)y$/.test(st)) st = st.slice(0, -1) + "i";
    return st + "er";
  }
  if (inf.endsWith("re")) return inf.slice(0, -1);
  return inf;
}

const IMPERSONAL = new Set(["falloir", "pleuvoir", "neiger"]);
const ETRE_VERBS = new Set(["aller", "venir", "arriver", "partir", "entrer", "rentrer", "sortir", "monter", "descendre", "naître", "mourir", "rester", "retourner", "tomber", "devenir", "revenir", "décéder", "apparaître"]);

export interface Conjugation {
  infinitive: string;
  en: string;
  irregular: boolean;
  aux: "avoir" | "être";
  pronominal: boolean;
  forms: Record<Tense, string[]>; // 6 forms each, with pronoun included
  irregularForms: Record<Tense, boolean[]>; // which forms differ from the regular pattern
  supported: boolean;
}

const AVOIR = ["ai", "as", "a", "avons", "avez", "ont"];
const ETRE = ["suis", "es", "est", "sommes", "êtes", "sont"];
const REFL = ["me", "te", "se", "nous", "vous", "se"];

const startsVowel = (s: string) => /^[aeiouyàâäéèêëîïôöùûüœh]/i.test(s) && !/^h(a|é)ï/.test(s);
function withPronoun(i: number, form: string, refl: boolean) {
  if (!form) return "";
  const p = ["je", "tu", "il / elle", "nous", "vous", "ils / elles"][i];
  let body = form;
  if (refl) {
    const r = REFL[i];
    body = (i < 3 || i === 5) && startsVowel(form) ? r[0] + "’" + form : r + " " + form;
  }
  if (i === 0 && startsVowel(body)) return "j’" + body;
  return p + " " + body;
}

export function conjugate(input: string): Conjugation {
  let inf = input.trim().toLowerCase().replace(/’/g, "'");
  let pronominal = false;
  if (/^se\s+/.test(inf)) { pronominal = true; inf = inf.replace(/^se\s+/, ""); }
  else if (/^s'/.test(inf)) { pronominal = true; inf = inf.slice(2); }

  const found = findIrregular(inf);
  const regPresent = inf.endsWith("oir") ? null : regularPresent(inf);
  const empty = () => ({ present: [], passe: [], imparfait: [], futur: [], conditionnel: [], subjonctif: [] }) as Record<Tense, any[]>;
  if (!found && !regPresent) {
    return { infinitive: inf, en: "", irregular: false, aux: "avoir", pronominal, forms: empty(), irregularForms: empty(), supported: false };
  }

  const pre = found?.prefix ?? "";
  const irr = found?.irr;
  const present = irr ? irr.present.map((f) => (f ? pre + f : "")) : regPresent!;
  const pp = irr ? pre + irr.pp : regularPP(inf);
  let etre = pronominal || ETRE_VERBS.has(inf) || (irr?.etre ?? false);
  if (found && pre) etre = pronominal || (PREFIX_ETRE.has(inf) ? true : PREFIX_AVOIR.has(inf) ? false : found.base === "venir" ? true : etre && !["tenir"].includes(found.base));
  if (found && pre && ["partir", "sortir"].includes(found.base) && !PREFIX_ETRE.has(inf)) etre = pronominal || false;

  // imparfait
  const nous = present[3];
  let impStem = irr?.imp ? pre + irr.imp : nous ? nous.replace(/ons$/, "") : "";
  const impEnd = ["ais", "ais", "ait", "ions", "iez", "aient"];
  const imparfait = impEnd.map((e) => {
    if (!impStem) return "";
    let s = impStem;
    if (e.startsWith("i")) {
      if (s.endsWith("ge") && inf.endsWith("ger")) s = s.slice(0, -1);
      if (s.endsWith("ç")) s = s.slice(0, -1) + "c";
    }
    return s + e;
  });

  // futur / conditionnel
  const fStem = irr?.fut ? pre + irr.fut : futureStem(inf);
  const futur = ["ai", "as", "a", "ons", "ez", "ont"].map((e) => fStem + e);
  const conditionnel = impEnd.map((e) => fStem + e);

  // subjonctif
  let subjonctif: string[];
  if (irr?.subj) subjonctif = irr.subj.map((f) => (f ? pre + f : ""));
  else {
    const ils = present[5];
    const st = ils ? ils.replace(/ent$/, "") : "";
    const nousImp = imparfait[3]?.replace(/ions$/, "") ?? st;
    subjonctif = [st + "e", st + "es", st + "e", nousImp + "ions", nousImp + "iez", st + "ent"];
    if (!ils) subjonctif = ["", "", "", "", "", ""];
  }

  // passé composé
  const aux = etre ? ETRE : AVOIR;
  const agree = (i: number) => (etre ? (i < 3 ? pp + "(e)" : pp + "(e)s") : pp);
  const passe = aux.map((a, i) => (present[i] || i === 2 ? withPronoun(i, a + " " + agree(i), pronominal) : ""));

  const raw: Record<Tense, string[]> = { present, passe: [], imparfait, futur, conditionnel, subjonctif };
  const forms = { ...raw } as Record<Tense, string[]>;
  (["present", "imparfait", "futur", "conditionnel", "subjonctif"] as Tense[]).forEach((t) => {
    forms[t] = raw[t].map((f, i) => withPronoun(i, f, pronominal));
  });
  forms.passe = passe;
  if (IMPERSONAL.has(inf)) {
    (Object.keys(forms) as Tense[]).forEach((t) => {
      forms[t] = forms[t].map((f, i) => (i === 2 ? f.replace(/^il \/ elle /, "il ") : ""));
    });
  }

  // highlight forms that don't follow the regular pattern of the verb's group
  const regGuess = regularPresent(inf);
  const irregularForms = empty();
  irregularForms.present = present.map((f, i) => !!irr && !!regGuess && f !== regGuess[i]);
  irregularForms.futur = futur.map(() => !!irr?.fut);
  irregularForms.conditionnel = conditionnel.map(() => !!irr?.fut);
  irregularForms.subjonctif = subjonctif.map(() => !!irr?.subj);
  irregularForms.imparfait = imparfait.map(() => !!irr?.imp && inf !== "falloir" && inf !== "pleuvoir");
  irregularForms.passe = passe.map(() => !!irr && pp !== regularPP(inf));

  const en = EN_EXTRA[(pronominal ? "" : "") + inf] ?? irr?.en ?? "";
  return { infinitive: (pronominal ? (startsVowel(inf) ? "s’" : "se ") : "") + inf, en, irregular: !!irr, aux: etre ? "être" : "avoir", pronominal, forms, irregularForms, supported: true };
}

/** The verbs everyone struggles with: most frequent irregular verbs. */
export const IRREGULAR_TOP = [
  "être", "avoir", "aller", "faire", "pouvoir", "vouloir", "devoir", "savoir", "venir", "prendre",
  "mettre", "dire", "voir", "croire", "tenir", "partir", "sortir", "dormir", "ouvrir", "connaître",
  "naître", "mourir", "lire", "écrire", "boire", "vivre", "suivre", "recevoir", "courir", "conduire",
  "rire", "plaire", "craindre", "envoyer", "falloir", "pleuvoir", "comprendre", "devenir", "apprendre", "valoir",
];

export function verbEnglish(inf: string) {
  return EN_EXTRA[inf] ?? I[inf]?.en ?? "";
}
