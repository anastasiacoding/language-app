export interface Rule {
  id: string;
  category: "Articles" | "Tenses" | "Verbs";
  title: string;
  short: string;
  explain: string[];
  table?: [string, string, boolean?][]; // [left, right, highlight]
  examples: [string, string][];
}

export const RULES: Rule[] = [
  {
    id: "definite",
    category: "Articles",
    title: "Definite articles",
    short: "le, la, l’, les",
    explain: [
      "Use the definite article for something specific or known, and for general likes and dislikes: J’aime le café.",
      "It agrees with the noun: le for masculine, la for feminine, les for all plurals. Before a vowel or a silent h, le and la become l’.",
    ],
    table: [["masculine", "le livre"], ["feminine", "la table"], ["before a vowel or silent h", "l’école, l’homme", true], ["plural", "les livres, les tables"]],
    examples: [["Le chat dort sur la chaise.", "The cat is sleeping on the chair."], ["J’aime les pommes.", "I like apples."], ["L’hôtel est fermé.", "The hotel is closed."]],
  },
  {
    id: "indefinite",
    category: "Articles",
    title: "Indefinite articles",
    short: "un, une, des",
    explain: [
      "Use un, une, des for something not specific: a, an, some.",
      "Un is masculine, une feminine, des is the plural for both. Unlike English, French needs des in the plural: J’ai des amis.",
    ],
    table: [["masculine", "un livre"], ["feminine", "une table"], ["plural", "des livres, des tables", true]],
    examples: [["Il y a un chat dans le jardin.", "There’s a cat in the garden."], ["Elle a une idée.", "She has an idea."], ["J’ai des questions.", "I have some questions."]],
  },
  {
    id: "contracted",
    category: "Articles",
    title: "Contracted articles",
    short: "au, aux, du, des",
    explain: ["The prepositions à and de merge with the articles le and les. They don’t merge with la or l’."],
    table: [["à + le", "au", true], ["à + les", "aux", true], ["de + le", "du", true], ["de + les", "des", true], ["à + la / l’", "à la / à l’"], ["de + la / l’", "de la / de l’"]],
    examples: [["Je vais au cinéma.", "I’m going to the cinema."], ["Le livre du professeur.", "The teacher’s book."], ["Elle parle aux enfants.", "She’s talking to the children."]],
  },
  {
    id: "partitive",
    category: "Articles",
    title: "Partitive article",
    short: "du, de la, de l’, des",
    explain: [
      "Use the partitive for an unspecified amount of something you can’t count: some bread, some water. English often drops it; French never does.",
      "It’s de + the definite article: du (masculine), de la (feminine), de l’ (before a vowel), des (plural).",
    ],
    table: [["masculine", "du pain"], ["feminine", "de la confiture"], ["before a vowel", "de l’eau", true], ["plural", "des pâtes"]],
    examples: [["Je voudrais du pain.", "I’d like some bread."], ["Tu bois de l’eau ?", "Are you drinking water?"], ["Nous mangeons des frites.", "We’re eating fries."]],
  },
  {
    id: "negation-de",
    category: "Articles",
    title: "Negation: pas de",
    short: "je ne mange pas de pain",
    explain: [
      "After a negation, un, une, des and the partitive (du, de la, de l’, des) all become de, or d’ before a vowel.",
      "The definite article doesn’t change: Je n’aime pas le café.",
    ],
    table: [["J’ai un chat.", "Je n’ai pas de chat.", true], ["Je bois du lait.", "Je ne bois pas de lait.", true], ["Il y a de l’eau.", "Il n’y a pas d’eau.", true], ["J’aime le thé.", "Je n’aime pas le thé."]],
    examples: [["Je ne mange pas de viande.", "I don’t eat meat."], ["Il n’a pas d’argent.", "He has no money."]],
  },
  {
    id: "passe-aux",
    category: "Tenses",
    title: "Passé composé: avoir or être",
    short: "j’ai mangé · je suis allée",
    explain: [
      "Most verbs form the passé composé with avoir + past participle.",
      "About 17 verbs of movement or change of state use être, and so do all reflexive verbs: aller, venir, arriver, partir, entrer, sortir, monter, descendre, naître, mourir, rester, tomber, retourner, devenir, revenir, rentrer, passer (par).",
      "With être, the participle agrees with the subject: elle est allée, ils sont partis.",
    ],
    table: [["avoir", "j’ai mangé, il a fini"], ["être", "je suis allé(e), elle est partie", true], ["reflexive", "je me suis levé(e)", true]],
    examples: [["Hier, j’ai vu un film.", "Yesterday I saw a film."], ["Elle est arrivée en retard.", "She arrived late."], ["Nous nous sommes promenés.", "We went for a walk."]],
  },
  {
    id: "present-irregular",
    category: "Verbs",
    title: "Present tense: key irregular verbs",
    short: "être, avoir, aller, faire…",
    explain: ["These verbs are used constantly and don’t follow the regular patterns. Knowing their present tense by heart unlocks most everyday sentences."],
    table: [["être", "suis, es, est, sommes, êtes, sont"], ["avoir", "ai, as, a, avons, avez, ont"], ["aller", "vais, vas, va, allons, allez, vont"], ["faire", "fais, fais, fait, faisons, faites, font"]],
    examples: [["Nous sommes à la maison.", "We’re at home."], ["Ils vont au marché.", "They’re going to the market."], ["Vous faites les courses ?", "Are you doing the shopping?"]],
  },
  {
    id: "imparfait-pc",
    category: "Tenses",
    title: "Imparfait or passé composé",
    short: "which one to use when",
    explain: [
      "Imparfait describes the background: habits, ongoing actions, descriptions, feelings, the weather. Think “was doing” or “used to”.",
      "Passé composé tells what happened: completed, one-off events that move the story forward. Think “did”.",
    ],
    table: [["habit, description", "imparfait", true], ["ongoing in the past", "imparfait", true], ["completed event", "passé composé"], ["sudden interruption", "passé composé"]],
    examples: [["Il pleuvait quand je suis sorti.", "It was raining when I went out."], ["Quand j’étais petite, je jouais au parc.", "When I was little, I used to play in the park."]],
  },
];

export const RULE_MAP = new Map(RULES.map((r) => [r.id, r]));
