// Common French nouns with grammatical gender and English meaning.
// [noun, gender, english, plural (only when irregular)]
export type G = "m" | "f";
export type Noun = { fr: string; g: G; en: string; pl?: string };

const RAW: [string, G, string, string?][] = [
  ["livre", "m", "book"], ["table", "f", "table"], ["chaise", "f", "chair"], ["maison", "f", "house"], ["voiture", "f", "car"],
  ["chat", "m", "cat"], ["chien", "m", "dog"], ["homme", "m", "man"], ["femme", "f", "woman"], ["enfant", "m", "child"],
  ["fille", "f", "girl"], ["garçon", "m", "boy"], ["ami", "m", "friend"], ["amie", "f", "friend (female)"], ["famille", "f", "family"],
  ["père", "m", "father"], ["mère", "f", "mother"], ["frère", "m", "brother"], ["sœur", "f", "sister"], ["ville", "f", "city"],
  ["village", "m", "village"], ["pays", "m", "country", "pays"], ["rue", "f", "street"], ["route", "f", "road"], ["pont", "m", "bridge"],
  ["école", "f", "school"], ["université", "f", "university"], ["bureau", "m", "office, desk", "bureaux"], ["travail", "m", "work", "travaux"], ["argent", "m", "money"],
  ["jour", "m", "day"], ["nuit", "f", "night"], ["matin", "m", "morning"], ["soir", "m", "evening"], ["semaine", "f", "week"],
  ["mois", "m", "month", "mois"], ["année", "f", "year"], ["an", "m", "year"], ["heure", "f", "hour"], ["minute", "f", "minute"],
  ["temps", "m", "time, weather", "temps"], ["saison", "f", "season"], ["été", "m", "summer"], ["hiver", "m", "winter"], ["printemps", "m", "spring", "printemps"],
  ["automne", "m", "autumn"], ["soleil", "m", "sun"], ["lune", "f", "moon"], ["étoile", "f", "star"], ["ciel", "m", "sky", "cieux"],
  ["mer", "f", "sea"], ["plage", "f", "beach"], ["montagne", "f", "mountain"], ["rivière", "f", "river"], ["forêt", "f", "forest"],
  ["arbre", "m", "tree"], ["fleur", "f", "flower"], ["jardin", "m", "garden"], ["herbe", "f", "grass"], ["pluie", "f", "rain"],
  ["neige", "f", "snow"], ["vent", "m", "wind"], ["eau", "f", "water", "eaux"], ["feu", "m", "fire", "feux"], ["terre", "f", "earth, ground"],
  ["pain", "m", "bread"], ["fromage", "m", "cheese"], ["viande", "f", "meat"], ["poisson", "m", "fish"], ["pomme", "f", "apple"],
  ["orange", "f", "orange"], ["fruit", "m", "fruit"], ["légume", "m", "vegetable"], ["salade", "f", "salad"], ["soupe", "f", "soup"],
  ["café", "m", "coffee, café"], ["thé", "m", "tea"], ["lait", "m", "milk"], ["vin", "m", "wine"], ["bière", "f", "beer"],
  ["sucre", "m", "sugar"], ["sel", "m", "salt"], ["beurre", "m", "butter"], ["confiture", "f", "jam"], ["chocolat", "m", "chocolate"],
  ["gâteau", "m", "cake", "gâteaux"], ["repas", "m", "meal", "repas"], ["dîner", "m", "dinner"], ["déjeuner", "m", "lunch"], ["cuisine", "f", "kitchen, cooking"],
  ["chambre", "f", "bedroom"], ["salle", "f", "room, hall"], ["porte", "f", "door"], ["fenêtre", "f", "window"], ["mur", "m", "wall"],
  ["lit", "m", "bed"], ["lampe", "f", "lamp"], ["clé", "f", "key"], ["téléphone", "m", "phone"], ["ordinateur", "m", "computer"],
  ["lettre", "f", "letter"], ["journal", "m", "newspaper", "journaux"], ["histoire", "f", "story, history"], ["question", "f", "question"], ["réponse", "f", "answer"],
  ["idée", "f", "idea"], ["problème", "m", "problem"], ["système", "m", "system"], ["thème", "m", "theme"], ["crème", "f", "cream"],
  ["musée", "m", "museum"], ["lycée", "m", "high school"], ["musique", "f", "music"], ["film", "m", "film"], ["chanson", "f", "song"],
  ["photo", "f", "photo"], ["image", "f", "picture"], ["page", "f", "page"], ["voyage", "m", "trip"], ["fromagerie", "f", "cheese shop"],
  ["boulangerie", "f", "bakery"], ["magasin", "m", "shop"], ["marché", "m", "market"], ["gare", "f", "train station"], ["train", "m", "train"],
  ["avion", "m", "plane"], ["bateau", "m", "boat", "bateaux"], ["vélo", "m", "bike"], ["bus", "m", "bus", "bus"], ["hôpital", "m", "hospital", "hôpitaux"],
  ["hôtel", "m", "hotel"], ["restaurant", "m", "restaurant"], ["église", "f", "church"], ["château", "m", "castle", "châteaux"], ["parc", "m", "park"],
  ["corps", "m", "body", "corps"], ["tête", "f", "head"], ["main", "f", "hand"], ["pied", "m", "foot"], ["bras", "m", "arm", "bras"],
  ["jambe", "f", "leg"], ["œil", "m", "eye", "yeux"], ["bouche", "f", "mouth"], ["nez", "m", "nose", "nez"], ["cœur", "m", "heart"],
  ["vie", "f", "life"], ["mort", "f", "death"], ["amour", "m", "love"], ["peur", "f", "fear"], ["joie", "f", "joy"],
  ["liberté", "f", "freedom"], ["vérité", "f", "truth"], ["beauté", "f", "beauty"], ["santé", "f", "health"], ["côté", "m", "side"],
  ["nation", "f", "nation"], ["information", "f", "information"], ["situation", "f", "situation"], ["moment", "m", "moment"], ["gouvernement", "m", "government"],
  ["appartement", "m", "flat"], ["fromage", "m", "cheese"], ["silence", "m", "silence"], ["chance", "f", "luck"], ["différence", "f", "difference"],
  ["nature", "f", "nature"], ["culture", "f", "culture"], ["peinture", "f", "painting"], ["roman", "m", "novel"], ["poème", "m", "poem"],
  ["mot", "m", "word"], ["phrase", "f", "sentence"], ["langue", "f", "language, tongue"], ["voix", "f", "voice", "voix"], ["nom", "m", "name, noun"],
  ["peau", "f", "skin", "peaux"], ["oiseau", "m", "bird", "oiseaux"], ["cheval", "m", "horse", "chevaux"], ["animal", "m", "animal", "animaux"], ["loup", "m", "wolf"],
  ["roi", "m", "king"], ["reine", "f", "queen"], ["prince", "m", "prince"], ["princesse", "f", "princess"], ["navire", "m", "ship"],
  ["port", "m", "port, harbour"], ["île", "f", "island"], ["vague", "f", "wave"], ["plume", "f", "feather, pen"], ["grenouille", "f", "frog"],
  ["huile", "f", "oil"], ["riz", "m", "rice", "riz"], ["farine", "f", "flour"], ["pâte", "f", "dough, pastry"], ["frite", "f", "fry"],
  ["ail", "m", "garlic"], ["épinard", "m", "spinach"], ["aéroport", "m", "airport"], ["piscine", "f", "swimming pool"], ["cinéma", "m", "cinema"],
  ["théâtre", "m", "theatre"], ["bibliothèque", "f", "library"], ["pharmacie", "f", "pharmacy"], ["banque", "f", "bank"], ["poste", "f", "post office"],
  ["mairie", "f", "town hall"], ["campagne", "f", "countryside"], ["étudiant", "m", "student"], ["professeur", "m", "teacher"], ["médecin", "m", "doctor"],
];

const seen = new Set<string>();
export const NOUNS: Noun[] = RAW.filter(([fr]) => (seen.has(fr) ? false : (seen.add(fr), true))).map(([fr, g, en, pl]) => ({ fr, g, en, pl }));

export const NOUN_MAP = new Map(NOUNS.map((n) => [n.fr, n]));

const H_MUET = new Set(["habit", "habitant", "habitation", "habitude", "harmonie", "herbe", "heure", "heureux", "hippopotame", "histoire", "hiver", "hommage", "homme", "honneur", "horaire", "horizon", "horloge", "horreur", "hospitalité", "hostilité", "huile", "humanité", "humeur", "humidité", "humour", "huître", "hygiène", "hypothèse", "hélicoptère", "hémisphère", "héritage", "héritier", "héroïne", "hésitation", "hôpital", "hôtel", "hôtesse"]);
export const H_ASPIRE = new Set(["héros", "haricot", "hibou", "honte", "hache", "haine", "hall", "hamac", "hameau", "hanche", "handicap", "hangar", "hareng", "hasard", "hauteur", "haut", "hockey", "homard", "housse", "hublot", "hurlement", "hutte", "halte", "harpe", "hérisson", "hêtre", "hiérarchie", "huit", "hâte", "hausse", "hernie", "houle", "hotte", "haie", "hamburger", "harcèlement", "hargne", "héron", "hoquet", "horde", "hamster", "handball", "hippie"]);
export function addHMuet(list: string[]) {
  for (const w of list) H_MUET.add(w);
}

/** True when the article elides before this word (l', d', de l'). */
export function elides(word: string) {
  return /^[aeiouàâäéèêëîïôöùûüœæ]/i.test(word) || H_MUET.has(word.toLowerCase());
}

export function plural(n: Noun) {
  if (n.pl) return n.pl;
  if (/(s|x|z)$/.test(n.fr)) return n.fr;
  if (/(eau|eu)$/.test(n.fr)) return n.fr + "x";
  if (/al$/.test(n.fr)) return n.fr.slice(0, -2) + "aux";
  return n.fr + "s";
}

/** Gender hints by ending, with known exceptions. Used when a noun isn't in the list. */
export const ENDINGS: { end: string; g: G; why: string; except: string[] }[] = [
  { end: "tion", g: "f", why: "Nouns ending in -tion are feminine.", except: [] },
  { end: "sion", g: "f", why: "Nouns ending in -sion are feminine.", except: [] },
  { end: "té", g: "f", why: "Nouns ending in -té are usually feminine.", except: ["été", "côté", "pâté", "comité", "traité"] },
  { end: "ette", g: "f", why: "Nouns ending in -ette are feminine.", except: ["squelette"] },
  { end: "ance", g: "f", why: "Nouns ending in -ance are feminine.", except: [] },
  { end: "ence", g: "f", why: "Nouns ending in -ence are feminine.", except: ["silence"] },
  { end: "ure", g: "f", why: "Nouns ending in -ure are usually feminine.", except: ["murmure", "mercure"] },
  { end: "ière", g: "f", why: "Nouns ending in -ière are usually feminine.", except: ["cimetière"] },
  { end: "ée", g: "f", why: "Nouns ending in -ée are usually feminine.", except: ["musée", "lycée", "trophée", "athée"] },
  { end: "ie", g: "f", why: "Nouns ending in -ie are usually feminine.", except: ["génie", "incendie", "parapluie"] },
  { end: "ise", g: "f", why: "Nouns ending in -ise are usually feminine.", except: [] },
  { end: "ade", g: "f", why: "Nouns ending in -ade are usually feminine.", except: ["stade", "grade"] },
  { end: "ème", g: "m", why: "Nouns ending in -ème of Greek origin are usually masculine.", except: ["crème"] },
  { end: "isme", g: "m", why: "Nouns ending in -isme are masculine.", except: [] },
  { end: "ment", g: "m", why: "Nouns ending in -ment are masculine.", except: ["jument"] },
  { end: "age", g: "m", why: "Nouns ending in -age are usually masculine.", except: ["page", "plage", "image", "cage", "rage", "nage", "page"] },
  { end: "eau", g: "m", why: "Nouns ending in -eau are usually masculine.", except: ["eau", "peau"] },
  { end: "oir", g: "m", why: "Nouns ending in -oir are masculine.", except: [] },
  { end: "eur", g: "m", why: "Nouns ending in -eur for people and machines are usually masculine; abstract ones (la peur, la couleur) are often feminine.", except: ["peur", "fleur", "couleur", "chaleur", "douleur", "valeur", "odeur", "erreur", "humeur", "sœur", "faveur", "largeur", "longueur", "hauteur"] },
  { end: "ier", g: "m", why: "Nouns ending in -ier are masculine.", except: [] },
  { end: "et", g: "m", why: "Nouns ending in -et are masculine.", except: [] },
  { end: "on", g: "m", why: "Nouns ending in -on are usually masculine.", except: ["maison", "chanson", "leçon", "façon", "boisson", "raison", "saison", "prison", "conversation"] },
  { end: "at", g: "m", why: "Nouns ending in -at are masculine.", except: [] },
  { end: "e", g: "f", why: "Many nouns ending in -e are feminine, but there are lots of exceptions.", except: [] },
];

let BIG: Map<string, { g: G | "mf"; en: string; en2?: string }> | null = null;

/** Loads about 17,700 nouns with gender and English meaning (Wiktionary via kaikki.org, Lexique). */
export async function loadAllNouns() {
  if (BIG) return;
  const m: any = await import("./nouns-all.json");
  const rows: any[] = m.default ?? m;
  BIG = new Map(rows.map((r) => [r[0], r[1] === "mf" ? { g: "mf", en: r[2], en2: r[3] } : { g: r[1], en: r[2] }]));
}

export function guessGender(word: string): { g: G; why: string; sure: boolean; en?: string; both?: { m: string; f: string } } | null {
  const w = word.trim().toLowerCase().replace(/^(le|la|l'|l’|un|une)\s*/, "");
  const big = BIG?.get(w);
  if (big?.g === "mf") return { g: "m", why: "This word has two genders, each with its own meaning.", sure: true, en: big.en, both: { m: big.en, f: big.en2 ?? "" } };
  const known = NOUN_MAP.get(w) ?? (big ? { fr: w, g: big.g as G, en: big.en } : undefined);
  if (known) {
    const rule = ENDINGS.find((e) => w.endsWith(e.end));
    let why = "";
    if (rule && rule.except.includes(w)) why = `An exception: most nouns ending in -${rule.end} are ${rule.g === "m" ? "masculine" : "feminine"}.`;
    else if (rule && rule.g === known.g && rule.end !== "e") why = rule.why;
    else if (rule && rule.g !== known.g) why = `An exception to the -${rule.end} pattern. Learn it with its article.`;
    else why = "There’s no reliable ending rule for this word, so learn it with its article.";
    return { g: known.g, why, sure: true, en: known.en };
  }
  for (const e of ENDINGS) {
    if (w.endsWith(e.end)) {
      if (e.except.includes(w)) return { g: e.g === "m" ? "f" : "m", why: `An exception to the -${e.end} pattern.`, sure: false };
      return { g: e.g, why: e.why, sure: false };
    }
  }
  return null;
}
