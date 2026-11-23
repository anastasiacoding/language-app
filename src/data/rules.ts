export type Level = "A1" | "A2" | "B1" | "B2";
export type Category = "Articles & nouns" | "Adjectives & adverbs" | "Pronouns" | "Verbs & tenses" | "Sentences" | "Prepositions";

export const LEVELS: { id: Level; name: string }[] = [
  { id: "A1", name: "Beginner" },
  { id: "A2", name: "Elementary" },
  { id: "B1", name: "Intermediate" },
  { id: "B2", name: "Upper intermediate" },
];
export const CATEGORY_ORDER: Category[] = ["Articles & nouns", "Adjectives & adverbs", "Pronouns", "Verbs & tenses", "Sentences", "Prepositions"];

export interface Rule {
  id: string;
  level: Level;
  category: Category;
  title: string;
  short: string;
  explain: string[];
  table?: [string, string, boolean?][]; // [left, right, highlight]
  examples: [string, string][];
}

export const RULES: Rule[] = [
  // ───────────────────────── A1 ─────────────────────────
  {
    id: "definite", level: "A1", category: "Articles & nouns",
    title: "Definite articles", short: "le, la, l’, les",
    explain: [
      "Use the definite article for something specific or known, and for general likes and dislikes: J’aime le café.",
      "It agrees with the noun: le for masculine, la for feminine, les for all plurals. Before a vowel or a silent h, le and la become l’.",
    ],
    table: [["masculine", "le livre"], ["feminine", "la table"], ["before a vowel or silent h", "l’école, l’homme", true], ["plural", "les livres, les tables"]],
    examples: [["Le chat dort sur la chaise.", "The cat is sleeping on the chair."], ["J’aime les pommes.", "I like apples."], ["L’hôtel est fermé.", "The hotel is closed."]],
  },
  {
    id: "indefinite", level: "A1", category: "Articles & nouns",
    title: "Indefinite articles", short: "un, une, des",
    explain: [
      "Use un, une, des for something not specific: a, an, some.",
      "Un is masculine, une feminine, des is the plural for both. Unlike English, French needs des in the plural: J’ai des amis.",
    ],
    table: [["masculine", "un livre"], ["feminine", "une table"], ["plural", "des livres, des tables", true]],
    examples: [["Il y a un chat dans le jardin.", "There’s a cat in the garden."], ["Elle a une idée.", "She has an idea."], ["J’ai des questions.", "I have some questions."]],
  },
  {
    id: "plural-nouns", level: "A1", category: "Articles & nouns",
    title: "Plural of nouns", short: "-s, -x, -aux",
    explain: [
      "Most nouns add -s in the plural, and you don’t hear it: un livre, des livres.",
      "Nouns ending in -s, -x or -z don’t change. Most nouns in -eau, -au and -eu add -x. Most nouns in -al become -aux.",
      "A few are irregular: un œil, des yeux; un travail, des travaux.",
    ],
    table: [["most nouns", "livre → livres"], ["-s, -x, -z", "bus → bus, prix → prix"], ["-eau, -au, -eu", "gâteau → gâteaux", true], ["-al", "journal → journaux", true], ["exceptions", "pneu → pneus, bal → bals"]],
    examples: [["J’ai acheté deux gâteaux.", "I bought two cakes."], ["Les journaux sont sur la table.", "The newspapers are on the table."], ["Elle a les yeux bleus.", "She has blue eyes."]],
  },
  {
    id: "contracted", level: "A1", category: "Articles & nouns",
    title: "Contracted articles", short: "au, aux, du, des",
    explain: ["The prepositions à and de merge with the articles le and les. They don’t merge with la or l’."],
    table: [["à + le", "au", true], ["à + les", "aux", true], ["de + le", "du", true], ["de + les", "des", true], ["à + la / l’", "à la / à l’"], ["de + la / l’", "de la / de l’"]],
    examples: [["Je vais au cinéma.", "I’m going to the cinema."], ["Le livre du professeur.", "The teacher’s book."], ["Elle parle aux enfants.", "She’s talking to the children."]],
  },
  {
    id: "partitive", level: "A1", category: "Articles & nouns",
    title: "Partitive article", short: "du, de la, de l’, des",
    explain: [
      "Use the partitive for an unspecified amount of something you can’t count: some bread, some water. English often drops it; French never does.",
      "It’s de + the definite article: du (masculine), de la (feminine), de l’ (before a vowel), des (plural).",
    ],
    table: [["masculine", "du pain"], ["feminine", "de la confiture"], ["before a vowel", "de l’eau", true], ["plural", "des pâtes"]],
    examples: [["Je voudrais du pain.", "I’d like some bread."], ["Tu bois de l’eau ?", "Are you drinking water?"], ["Nous mangeons des frites.", "We’re eating fries."]],
  },
  {
    id: "possessives", level: "A1", category: "Adjectives & adverbs",
    title: "Possessive adjectives", short: "mon, ma, mes, son, sa, ses…",
    explain: [
      "The possessive agrees with the thing owned, not with the owner: sa voiture can mean his car or her car.",
      "Before a feminine noun starting with a vowel, use mon, ton, son instead of ma, ta, sa: mon amie, son école.",
    ],
    table: [["my", "mon · ma · mes"], ["your (tu)", "ton · ta · tes"], ["his / her", "son · sa · ses"], ["our", "notre · notre · nos"], ["your (vous)", "votre · votre · vos"], ["their", "leur · leur · leurs"], ["fem. + vowel", "mon amie, ton histoire", true]],
    examples: [["C’est mon frère et ma sœur.", "This is my brother and my sister."], ["Elle cherche ses clés.", "She’s looking for her keys."], ["Ton école est loin ?", "Is your school far?"]],
  },
  {
    id: "demonstratives", level: "A1", category: "Adjectives & adverbs",
    title: "Demonstrative adjectives", short: "ce, cet, cette, ces",
    explain: [
      "Ce, cet, cette, ces mean this, that, these, those.",
      "Use cet before a masculine noun starting with a vowel or a silent h, so it sounds smooth: cet homme, cet arbre.",
      "Add -ci or -là to the noun to insist on this one or that one: ce livre-ci, ce livre-là.",
    ],
    table: [["masculine", "ce livre"], ["masc. + vowel", "cet ami, cet hôtel", true], ["feminine", "cette maison"], ["plural", "ces livres, ces maisons"]],
    examples: [["Cette robe est jolie.", "This dress is pretty."], ["Cet hôtel est cher.", "That hotel is expensive."], ["Ces gâteaux sont délicieux.", "These cakes are delicious."]],
  },
  {
    id: "adjective-agreement", level: "A1", category: "Adjectives & adverbs",
    title: "Adjective agreement", short: "petit, petite, petits, petites",
    explain: [
      "Adjectives agree in gender and number with the noun. Add -e for feminine, -s for plural, -es for feminine plural.",
      "Adjectives already ending in -e don’t change in the feminine: un livre rouge, une robe rouge.",
      "Common patterns: -eux → -euse, -if → -ive, -er → -ère, -en → -enne, -on → -onne, -el → -elle.",
    ],
    table: [["regular", "grand · grande · grands · grandes"], ["-eux", "heureux · heureuse", true], ["-if", "sportif · sportive", true], ["-er", "cher · chère"], ["-en / -on", "italien · italienne, bon · bonne"], ["irregular", "beau · belle, vieux · vieille, blanc · blanche"]],
    examples: [["Ma sœur est très sportive.", "My sister is very sporty."], ["Les rues sont calmes.", "The streets are quiet."], ["Ils sont heureux.", "They are happy."]],
  },
  {
    id: "present-er", level: "A1", category: "Verbs & tenses",
    title: "Present tense: -er verbs", short: "je parle, nous parlons",
    explain: [
      "About 90% of French verbs end in -er and follow the same pattern. Remove -er and add the endings.",
      "The endings -e, -es, -e and -ent all sound the same, so je parle, tu parles, il parle and ils parlent sound identical.",
      "Some verbs change their spelling: j’achète, nous mangeons, il appelle.",
    ],
    table: [["je", "parle"], ["tu", "parles"], ["il / elle", "parle"], ["nous", "parlons", true], ["vous", "parlez", true], ["ils / elles", "parlent"]],
    examples: [["Je travaille à Lyon.", "I work in Lyon."], ["Nous regardons un film.", "We’re watching a film."], ["Ils habitent ici.", "They live here."]],
  },
  {
    id: "present-ir-re", level: "A1", category: "Verbs & tenses",
    title: "Present tense: -ir and -re verbs", short: "je finis, je vends",
    explain: [
      "Regular -ir verbs like finir add -iss- in the plural: nous finissons, ils finissent.",
      "Regular -re verbs like vendre keep the d in the singular without an ending in il / elle: il vend.",
    ],
    table: [["finir", "finis, finis, finit, finissons, finissez, finissent", true], ["vendre", "vends, vends, vend, vendons, vendez, vendent"]],
    examples: [["Je finis à six heures.", "I finish at six."], ["Ils choisissent un dessert.", "They’re choosing a dessert."], ["Elle attend le bus.", "She’s waiting for the bus."]],
  },
  {
    id: "present-irregular", level: "A1", category: "Verbs & tenses",
    title: "Present tense: key irregular verbs", short: "être, avoir, aller, faire…",
    explain: ["These verbs are used constantly and don’t follow the regular patterns. Knowing their present tense by heart unlocks most everyday sentences."],
    table: [["être", "suis, es, est, sommes, êtes, sont"], ["avoir", "ai, as, a, avons, avez, ont"], ["aller", "vais, vas, va, allons, allez, vont"], ["faire", "fais, fais, fait, faisons, faites, font"]],
    examples: [["Nous sommes à la maison.", "We’re at home."], ["Ils vont au marché.", "They’re going to the market."], ["Vous faites les courses ?", "Are you doing the shopping?"]],
  },
  {
    id: "futur-proche", level: "A1", category: "Verbs & tenses",
    title: "Near future", short: "je vais partir",
    explain: [
      "To talk about the future, especially plans, use aller in the present + an infinitive: going to.",
      "It’s the most common way to talk about the future in everyday French.",
    ],
    table: [["je", "vais manger"], ["tu", "vas manger"], ["il / elle", "va manger"], ["nous", "allons manger"], ["vous", "allez manger"], ["ils / elles", "vont manger"]],
    examples: [["Je vais appeler ma mère.", "I’m going to call my mother."], ["Il va pleuvoir.", "It’s going to rain."], ["Nous allons partir demain.", "We’re leaving tomorrow."]],
  },
  {
    id: "negation", level: "A1", category: "Sentences",
    title: "Negation: ne … pas", short: "je ne parle pas",
    explain: [
      "Put ne before the verb and pas after it. Ne becomes n’ before a vowel or a silent h: je n’aime pas.",
      "In the passé composé, ne … pas goes around the auxiliary: je n’ai pas mangé.",
      "In spoken French, people often drop ne: je sais pas. Keep it when you write.",
    ],
    table: [["present", "Il ne travaille pas."], ["before a vowel", "Elle n’aime pas le thé.", true], ["passé composé", "Je n’ai pas compris.", true], ["infinitive", "Je préfère ne pas sortir."]],
    examples: [["Je ne parle pas allemand.", "I don’t speak German."], ["Nous n’habitons pas ici.", "We don’t live here."], ["Il n’a pas fini.", "He hasn’t finished."]],
  },
  {
    id: "negation-de", level: "A1", category: "Articles & nouns",
    title: "Negation: pas de", short: "je ne mange pas de pain",
    explain: [
      "After a negation, un, une, des and the partitive (du, de la, de l’, des) all become de, or d’ before a vowel.",
      "The definite article doesn’t change: Je n’aime pas le café.",
    ],
    table: [["J’ai un chat.", "Je n’ai pas de chat.", true], ["Je bois du lait.", "Je ne bois pas de lait.", true], ["Il y a de l’eau.", "Il n’y a pas d’eau.", true], ["J’aime le thé.", "Je n’aime pas le thé."]],
    examples: [["Je ne mange pas de viande.", "I don’t eat meat."], ["Il n’a pas d’argent.", "He has no money."]],
  },
  {
    id: "questions", level: "A1", category: "Sentences",
    title: "Question words", short: "où, quand, comment, pourquoi…",
    explain: [
      "Three ways to ask: intonation (Tu viens ?), est-ce que (Est-ce que tu viens ?) and inversion (Viens-tu ?).",
      "Question words go at the start, or at the end in casual speech: Où tu habites ? / Tu habites où ?",
      "What is qu’est-ce que at the start, and quoi at the end: Qu’est-ce que tu fais ? / Tu fais quoi ?",
    ],
    table: [["where", "où"], ["when", "quand"], ["how", "comment"], ["why", "pourquoi"], ["how much / many", "combien (de)"], ["who", "qui"], ["what", "qu’est-ce que · quoi", true]],
    examples: [["Où est la gare ?", "Where is the station?"], ["Combien ça coûte ?", "How much is it?"], ["Pourquoi tu ris ?", "Why are you laughing?"]],
  },
  {
    id: "quel", level: "A1", category: "Sentences",
    title: "Quel, quelle, quels, quelles", short: "which, what",
    explain: [
      "Quel means which or what before a noun, and agrees with it.",
      "It also starts exclamations: Quelle belle journée ! What a beautiful day!",
    ],
    table: [["masculine", "quel livre ?"], ["feminine", "quelle heure ?"], ["masc. plural", "quels films ?"], ["fem. plural", "quelles chaussures ?"], ["exclamation", "Quel dommage !", true]],
    examples: [["Quel âge as-tu ?", "How old are you?"], ["Quelle est ton adresse ?", "What is your address?"], ["Quels pays as-tu visités ?", "Which countries have you visited?"]],
  },
  {
    id: "stressed-pronouns", level: "A1", category: "Pronouns",
    title: "Stressed pronouns", short: "moi, toi, lui, elle, eux…",
    explain: [
      "Use stressed pronouns after a preposition (avec moi, chez toi), for emphasis (Moi, je reste), after c’est (C’est lui) and alone (Et toi ?).",
    ],
    table: [["je", "moi"], ["tu", "toi"], ["il / elle", "lui / elle"], ["nous", "nous"], ["vous", "vous"], ["ils / elles", "eux / elles", true]],
    examples: [["Tu viens avec moi ?", "Are you coming with me?"], ["On dîne chez eux ce soir.", "We’re having dinner at their place tonight."], ["Moi, je préfère le thé.", "Me, I prefer tea."]],
  },
  {
    id: "places", level: "A1", category: "Prepositions",
    title: "Cities and countries", short: "à Paris, en France, au Japon",
    explain: [
      "Use à before a city, en before a feminine country (most countries ending in -e) or a country starting with a vowel, au before a masculine country, and aux before a plural country.",
      "The same words mean both in and to: J’habite en Italie. Je vais en Italie.",
    ],
    table: [["city", "à Paris, à Londres"], ["feminine country", "en France, en Chine"], ["country with a vowel", "en Iran, en Équateur"], ["masculine country", "au Japon, au Canada", true], ["plural country", "aux États-Unis", true]],
    examples: [["Elle habite au Portugal.", "She lives in Portugal."], ["Nous allons en Espagne cet été.", "We’re going to Spain this summer."], ["Il travaille à Berlin.", "He works in Berlin."]],
  },

  // ───────────────────────── A2 ─────────────────────────
  {
    id: "articles-mix", level: "A2", category: "Articles & nouns",
    title: "Articles: mixed challenge", short: "le, un, du, au, de… all together",
    explain: [
      "All the articles in one exercise, with six options to choose from. Read the whole sentence and the English: the meaning tells you which article you need.",
      "Ask yourself: is it specific or general (le)? Countable and not specific (un)? An amount (du)? Is there à or de before it (au, du)? Is the sentence negative (de)?",
    ],
    table: [["general, likes", "J’aime le café."], ["specific", "Le livre est sur la table."], ["not specific", "Il y a un chat."], ["an amount", "Je voudrais du pain.", true], ["à / de + article", "Je pense au voyage. On parle du film.", true], ["negation", "Je n’ai pas de voiture.", true], ["negation + aimer", "Je n’aime pas le thé."]],
    examples: [["Je bois de l’eau, mais je n’aime pas l’eau gazeuse.", "I drink water, but I don’t like sparkling water."], ["Il n’y a pas de pain, je vais à la boulangerie.", "There’s no bread, I’m going to the bakery."], ["J’ai parlé au professeur des examens.", "I talked to the teacher about the exams."]],
  },
  {
    id: "adjective-position", level: "A2", category: "Adjectives & adverbs",
    title: "Position of adjectives", short: "une petite maison rouge",
    explain: [
      "Most adjectives go after the noun: une voiture rouge, un film intéressant.",
      "A few short, common ones go before. Remember BAGS: Beauty (beau, joli), Age (jeune, vieux, nouveau), Goodness (bon, mauvais), Size (petit, grand, gros, long).",
      "Before a masculine noun starting with a vowel: un bel homme, un vieil ami, un nouvel appartement.",
    ],
    table: [["after the noun", "un livre intéressant"], ["Beauty", "une belle vue", true], ["Age", "un jeune homme", true], ["Goodness", "un bon repas", true], ["Size", "une petite ville", true]],
    examples: [["Ils ont une grande maison blanche.", "They have a big white house."], ["C’est un bon restaurant italien.", "It’s a good Italian restaurant."], ["J’ai un nouvel ordinateur.", "I have a new computer."]],
  },
  {
    id: "comparatives", level: "A2", category: "Adjectives & adverbs",
    title: "Comparatives", short: "plus, moins, aussi … que",
    explain: [
      "Compare with plus … que (more), moins … que (less) and aussi … que (as). The adjective still agrees.",
      "Bon becomes meilleur (better, adjective) and bien becomes mieux (better, adverb). Never say plus bon.",
    ],
    table: [["more", "Léa est plus grande que Paul."], ["less", "Ce film est moins long que l’autre."], ["as", "Il est aussi fatigué que moi."], ["bon → meilleur", "Ce gâteau est meilleur.", true], ["bien → mieux", "Elle chante mieux que moi.", true]],
    examples: [["Paris est plus grand que Lyon.", "Paris is bigger than Lyon."], ["Le train est moins cher que l’avion.", "The train is cheaper than the plane."], ["Tu parles mieux français que moi.", "You speak French better than me."]],
  },
  {
    id: "superlatives", level: "A2", category: "Adjectives & adverbs",
    title: "Superlatives", short: "le plus, la moins…",
    explain: [
      "The superlative is le, la or les + plus or moins + adjective. The article agrees with the noun.",
      "If the adjective goes after the noun, repeat the article: la ville la plus belle. Use de after it: le plus grand de France.",
      "Bon becomes le meilleur, la meilleure.",
    ],
    table: [["masculine", "le film le plus long"], ["feminine", "la rue la plus calme"], ["plural", "les livres les plus chers"], ["before the noun", "la plus grande ville", true], ["good", "le meilleur, la meilleure", true]],
    examples: [["C’est la plus belle plage de la région.", "It’s the most beautiful beach in the region."], ["C’est le restaurant le moins cher.", "It’s the cheapest restaurant."], ["Ce sont mes meilleurs amis.", "They’re my best friends."]],
  },
  {
    id: "tout", level: "A2", category: "Adjectives & adverbs",
    title: "Tout, toute, tous, toutes", short: "tout le monde, toute la journée",
    explain: [
      "Before an article and a noun, tout means all or the whole, and agrees with the noun.",
      "Tous les … and toutes les … also mean every: tous les jours, every day.",
    ],
    table: [["masculine", "tout le temps"], ["feminine", "toute la nuit"], ["masc. plural", "tous les jours", true], ["fem. plural", "toutes les semaines", true]],
    examples: [["J’ai travaillé toute la journée.", "I worked all day."], ["Tous les enfants sont là.", "All the children are here."], ["Tout le monde aime ce film.", "Everybody likes this film."]],
  },
  {
    id: "passe-aux", level: "A2", category: "Verbs & tenses",
    title: "Passé composé: avoir or être", short: "j’ai mangé · je suis allée",
    explain: [
      "Most verbs form the passé composé with avoir + past participle.",
      "About 17 verbs of movement or change of state use être, and so do all reflexive verbs: aller, venir, arriver, partir, entrer, sortir, monter, descendre, naître, mourir, rester, tomber, retourner, devenir, revenir, rentrer, passer (par).",
      "With être, the participle agrees with the subject: elle est allée, ils sont partis.",
    ],
    table: [["avoir", "j’ai mangé, il a fini"], ["être", "je suis allé(e), elle est partie", true], ["reflexive", "je me suis levé(e)", true]],
    examples: [["Hier, j’ai vu un film.", "Yesterday I saw a film."], ["Elle est arrivée en retard.", "She arrived late."], ["Nous nous sommes promenés.", "We went for a walk."]],
  },
  {
    id: "past-participles", level: "A2", category: "Verbs & tenses",
    title: "Past participles", short: "fait, pris, vu, mis…",
    explain: [
      "Regular participles: -er → -é (parlé), -ir → -i (fini), -re → -u (vendu).",
      "Many common verbs are irregular and simply need to be learned: faire → fait, prendre → pris, voir → vu, mettre → mis, avoir → eu, être → été.",
    ],
    table: [["-er", "parler → parlé"], ["-ir", "finir → fini"], ["-re", "vendre → vendu"], ["-is", "prendre → pris, mettre → mis", true], ["-u", "voir → vu, lire → lu, boire → bu", true], ["-t", "faire → fait, dire → dit, écrire → écrit", true]],
    examples: [["J’ai pris le train.", "I took the train."], ["Tu as lu ce livre ?", "Have you read this book?"], ["Ils ont mis la table.", "They set the table."]],
  },
  {
    id: "pc-agreement", level: "A2", category: "Verbs & tenses",
    title: "Agreement with être", short: "elle est partie, ils sont venus",
    explain: [
      "When the passé composé uses être, the participle agrees with the subject like an adjective: add -e for feminine, -s for plural.",
      "A mixed group of men and women takes the masculine plural: Paul et Léa sont partis.",
    ],
    table: [["il", "est parti"], ["elle", "est partie", true], ["ils", "sont partis", true], ["elles", "sont parties", true]],
    examples: [["Ma sœur est née en 1995.", "My sister was born in 1995."], ["Ils sont rentrés tard.", "They came home late."], ["Elles sont restées à la maison.", "They stayed at home."]],
  },
  {
    id: "imparfait-forms", level: "A2", category: "Verbs & tenses",
    title: "Imparfait: forms", short: "je parlais, nous finissions",
    explain: [
      "Take the nous form of the present, remove -ons, and add -ais, -ais, -ait, -ions, -iez, -aient.",
      "Only être is irregular: j’étais, nous étions.",
      "Use it for descriptions, habits and ongoing actions in the past.",
    ],
    table: [["nous finissons", "finiss-"], ["je / tu", "-ais"], ["il / elle", "-ait"], ["nous", "-ions"], ["vous", "-iez"], ["ils / elles", "-aient"], ["être", "ét- (j’étais)", true]],
    examples: [["Quand j’étais petite, j’habitais à Nice.", "When I was little, I lived in Nice."], ["Il faisait beau.", "The weather was nice."], ["Nous jouions dans le jardin.", "We used to play in the garden."]],
  },
  {
    id: "imparfait-pc", level: "A2", category: "Verbs & tenses",
    title: "Imparfait or passé composé", short: "which one to use when",
    explain: [
      "Imparfait describes the background: habits, ongoing actions, descriptions, feelings, the weather. Think “was doing” or “used to”.",
      "Passé composé tells what happened: completed, one-off events that move the story forward. Think “did”.",
    ],
    table: [["habit, description", "imparfait", true], ["ongoing in the past", "imparfait", true], ["completed event", "passé composé"], ["sudden interruption", "passé composé"]],
    examples: [["Il pleuvait quand je suis sorti.", "It was raining when I went out."], ["Quand j’étais petite, je jouais au parc.", "When I was little, I used to play in the park."]],
  },
  {
    id: "futur-simple", level: "A2", category: "Verbs & tenses",
    title: "Futur simple", short: "je parlerai, tu finiras",
    explain: [
      "Add -ai, -as, -a, -ons, -ez, -ont to the infinitive. For -re verbs, drop the final e: prendre → je prendrai.",
      "Common irregular stems: être → ser-, avoir → aur-, aller → ir-, faire → fer-, venir → viendr-, pouvoir → pourr-, voir → verr-, vouloir → voudr-.",
    ],
    table: [["parler", "je parlerai, nous parlerons"], ["prendre", "je prendrai"], ["être", "je serai", true], ["avoir", "j’aurai", true], ["aller", "j’irai", true], ["faire", "je ferai", true]],
    examples: [["Demain, il fera beau.", "Tomorrow the weather will be nice."], ["Nous irons à Rome l’année prochaine.", "We’ll go to Rome next year."], ["Je t’appellerai ce soir.", "I’ll call you tonight."]],
  },
  {
    id: "passe-recent", level: "A2", category: "Verbs & tenses",
    title: "Recent past", short: "je viens de manger",
    explain: [
      "To say you have just done something, use venir in the present + de + infinitive. De becomes d’ before a vowel.",
    ],
    table: [["je", "viens de partir"], ["tu", "viens de partir"], ["il / elle", "vient de partir"], ["nous", "venons de partir"], ["vous", "venez de partir"], ["ils / elles", "viennent de partir"], ["before a vowel", "Il vient d’arriver.", true]],
    examples: [["Je viens de finir mon travail.", "I’ve just finished my work."], ["Le train vient d’arriver.", "The train has just arrived."], ["Ils viennent de déménager.", "They’ve just moved."]],
  },
  {
    id: "reflexive", level: "A2", category: "Verbs & tenses",
    title: "Reflexive verbs", short: "je me lève, tu te couches",
    explain: [
      "Reflexive verbs have a pronoun that matches the subject: me, te, se, nous, vous, se. Me, te, se become m’, t’, s’ before a vowel.",
      "Many daily-routine verbs are reflexive: se lever, se laver, s’habiller, se coucher.",
    ],
    table: [["je", "me lève"], ["tu", "te lèves"], ["il / elle", "se lève"], ["nous", "nous levons"], ["vous", "vous levez"], ["ils / elles", "se lèvent"], ["before a vowel", "je m’habille", true]],
    examples: [["Je me lève à sept heures.", "I get up at seven."], ["Elle s’appelle Julie.", "Her name is Julie."], ["Vous vous promenez souvent ?", "Do you often go for walks?"]],
  },
  {
    id: "imperative", level: "A2", category: "Verbs & tenses",
    title: "Imperative", short: "parle ! finissons ! venez !",
    explain: [
      "The imperative gives orders and advice. It uses the tu, nous and vous forms of the present, without the pronoun.",
      "For -er verbs and aller, drop the -s of the tu form: tu parles → parle ! tu vas → va !",
      "Irregular: être → sois, soyons, soyez; avoir → aie, ayons, ayez; savoir → sache, sachons, sachez.",
    ],
    table: [["tu (-er)", "Regarde !", true], ["tu (other)", "Finis ! Prends !"], ["nous", "Partons !"], ["vous", "Venez !"], ["être", "Sois sage !"]],
    examples: [["Ferme la porte, s’il te plaît.", "Close the door, please."], ["Allons au cinéma !", "Let’s go to the cinema!"], ["Prenez la première rue à gauche.", "Take the first street on the left."]],
  },
  {
    id: "direct-pronouns", level: "A2", category: "Pronouns",
    title: "Direct object pronouns", short: "le, la, l’, les",
    explain: [
      "Le, la, les replace a direct object (no preposition): Je vois Marie → Je la vois.",
      "They go before the verb. Le and la become l’ before a vowel: je l’aime.",
      "In the negative: Je ne la vois pas.",
    ],
    table: [["masculine", "le bus → je le prends"], ["feminine", "la télé → je la regarde"], ["plural", "les clés → je les cherche"], ["before a vowel", "je l’aime, il l’attend", true]],
    examples: [["Tu connais Paul ? — Oui, je le connais.", "Do you know Paul? — Yes, I know him."], ["Ces chaussures, je les adore.", "These shoes, I love them."], ["La porte ? Je ne l’ai pas fermée.", "The door? I didn’t close it."]],
  },
  {
    id: "indirect-pronouns", level: "A2", category: "Pronouns",
    title: "Indirect object pronouns", short: "lui, leur",
    explain: [
      "Lui (to him, to her) and leur (to them) replace à + a person: Je parle à Marie → Je lui parle.",
      "Common verbs with à: parler à, téléphoner à, écrire à, répondre à, donner à, dire à, offrir à.",
      "Don’t confuse leur (pronoun, no -s) with leur / leurs (their).",
    ],
    table: [["à + one person", "lui", true], ["à + several people", "leur", true], ["me / te / nous / vous", "Il me parle. Je vous écris."]],
    examples: [["Tu as écrit à ta mère ? — Oui, je lui ai écrit.", "Did you write to your mother? — Yes, I wrote to her."], ["Je leur téléphone ce soir.", "I’m calling them tonight."]],
  },
  {
    id: "y-en", level: "A2", category: "Pronouns",
    title: "The pronouns y and en", short: "j’y vais, j’en veux",
    explain: [
      "Y replaces a place (à, en, chez, dans…) or à + a thing: Je vais à Paris → J’y vais. Je pense à mon travail → J’y pense.",
      "En replaces de + a thing, a partitive or a quantity: Tu veux du café ? → J’en veux. J’ai deux sœurs → J’en ai deux.",
      "Both go before the verb, or before the auxiliary in the passé composé.",
    ],
    table: [["à + place", "J’y vais.", true], ["à + thing", "J’y pense."], ["de + thing", "J’en parle.", true], ["du, de la, des", "J’en mange."], ["quantity", "J’en ai trois."]],
    examples: [["On y va ?", "Shall we go?"], ["Il y en a encore ?", "Is there any left?"], ["Je n’y suis jamais allée.", "I’ve never been there."]],
  },
  {
    id: "c-est-il-est", level: "A2", category: "Sentences",
    title: "C’est or il est", short: "c’est un médecin · il est médecin",
    explain: [
      "Use c’est (ce sont) before a determiner + noun or a name: C’est mon frère. C’est un bon médecin. C’est Marie.",
      "Use il est / elle est before a profession or nationality without an article, or an adjective about a specific person or thing: Il est médecin. Elle est française.",
      "C’est + adjective comments on a general idea or a situation: C’est difficile !",
    ],
    table: [["+ article + noun", "C’est un ami.", true], ["+ name", "C’est Paul."], ["+ profession", "Il est professeur.", true], ["+ adjective (person, thing)", "Elle est grande."], ["+ adjective (idea)", "C’est génial !"]],
    examples: [["C’est une actrice célèbre.", "She’s a famous actress."], ["Elle est actrice.", "She’s an actress."], ["Ce sont mes parents.", "These are my parents."]],
  },
  {
    id: "negation-more", level: "A2", category: "Sentences",
    title: "Other negations", short: "ne … jamais, rien, personne, plus",
    explain: [
      "Ne … jamais (never), ne … rien (nothing), ne … personne (nobody), ne … plus (no longer), ne … aucun(e) (not a single), ne … que (only).",
      "In the passé composé, personne and aucun go after the participle: Je n’ai vu personne. The others go before it: Je n’ai rien vu.",
      "Rien and personne can be the subject: Personne n’est venu.",
    ],
    table: [["never", "ne … jamais"], ["nothing", "ne … rien"], ["nobody", "ne … personne"], ["no longer", "ne … plus"], ["not one", "ne … aucun(e)"], ["only", "ne … que", true], ["neither … nor", "ne … ni … ni"]],
    examples: [["Je ne bois jamais de café.", "I never drink coffee."], ["Il n’y a plus de pain.", "There’s no more bread."], ["Je n’ai que dix euros.", "I only have ten euros."]],
  },
  {
    id: "relative-qui-que", level: "A2", category: "Sentences",
    title: "Relative pronouns: qui, que", short: "le livre qui…, le livre que…",
    explain: [
      "Qui replaces the subject of the next verb: L’homme qui parle (the man is speaking).",
      "Que replaces the object: L’homme que je vois (I see the man). Que becomes qu’ before a vowel; qui never does.",
      "A quick test: if the next word is the verb, use qui; if it’s a subject (je, tu, Marie…), use que.",
    ],
    table: [["+ verb", "la fille qui chante", true], ["+ subject + verb", "la fille que je connais", true], ["before a vowel", "le film qu’il a vu"]],
    examples: [["J’ai un ami qui habite à Rome.", "I have a friend who lives in Rome."], ["C’est la robe que j’ai achetée.", "It’s the dress I bought."], ["Le bus qui passe ici va à la gare.", "The bus that stops here goes to the station."]],
  },
  {
    id: "time-prepositions", level: "A2", category: "Prepositions",
    title: "Time: depuis, pendant, il y a, dans, en", short: "for, ago, in",
    explain: [
      "Depuis + present: an action that started in the past and is still going on. J’habite ici depuis deux ans.",
      "Pendant: a completed period (for). Il y a: ago. Dans: in (from now). En: the time it takes to do something.",
    ],
    table: [["still going on", "depuis deux ans", true], ["finished period", "pendant deux ans"], ["ago", "il y a deux ans", true], ["from now", "dans deux jours"], ["time taken", "en deux heures"], ["planned period", "pour une semaine"]],
    examples: [["J’apprends le français depuis un an.", "I’ve been learning French for a year."], ["Je suis arrivée il y a trois jours.", "I arrived three days ago."], ["Le cours commence dans cinq minutes.", "The class starts in five minutes."]],
  },

  // ───────────────────────── B1 ─────────────────────────
  {
    id: "adverbs-ment", level: "B1", category: "Adjectives & adverbs",
    title: "Adverbs in -ment", short: "lentement, vraiment, évidemment",
    explain: [
      "Add -ment to the feminine adjective: lent → lente → lentement.",
      "If the masculine ends in a vowel, add -ment to it: vrai → vraiment, poli → poliment.",
      "-ant → -amment and -ent → -emment, both pronounced “amment”: courant → couramment, évident → évidemment.",
    ],
    table: [["feminine + -ment", "heureuse → heureusement"], ["vowel + -ment", "vrai → vraiment"], ["-ant → -amment", "constant → constamment", true], ["-ent → -emment", "récent → récemment", true], ["irregular", "gentil → gentiment, bref → brièvement"]],
    examples: [["Parlez lentement, s’il vous plaît.", "Speak slowly, please."], ["Elle parle couramment anglais.", "She speaks English fluently."], ["Évidemment, il est en retard.", "Obviously, he’s late."]],
  },
  {
    id: "demonstrative-pronouns", level: "B1", category: "Pronouns",
    title: "Demonstrative pronouns", short: "celui, celle, ceux, celles",
    explain: [
      "Celui, celle, ceux, celles replace a noun already mentioned: this one, that one, the one(s). They agree with the noun.",
      "They’re followed by -ci / -là, de, or a relative pronoun: celui-ci, celle de Marie, ceux qui…",
    ],
    table: [["masculine", "celui"], ["feminine", "celle"], ["masc. plural", "ceux", true], ["fem. plural", "celles"]],
    examples: [["Quel gâteau ? Celui-ci ou celui-là ?", "Which cake? This one or that one?"], ["Ma voiture est rouge, celle de Paul est noire.", "My car is red, Paul’s is black."], ["Ceux qui veulent partir peuvent partir.", "Those who want to leave can leave."]],
  },
  {
    id: "possessive-pronouns", level: "B1", category: "Pronouns",
    title: "Possessive pronouns", short: "le mien, la tienne, les nôtres",
    explain: [
      "Possessive pronouns replace a possessive + noun: mon livre → le mien. They agree with the thing owned.",
      "Notre / votre become le nôtre, le vôtre, with a circumflex.",
    ],
    table: [["mine", "le mien · la mienne · les miens · les miennes"], ["yours (tu)", "le tien · la tienne · les tiens · les tiennes"], ["his / hers", "le sien · la sienne · les siens · les siennes"], ["ours", "le nôtre · la nôtre · les nôtres", true], ["yours (vous)", "le vôtre · la vôtre · les vôtres", true], ["theirs", "le leur · la leur · les leurs"]],
    examples: [["Ce n’est pas ton stylo, c’est le mien.", "It’s not your pen, it’s mine."], ["Leurs enfants sont plus âgés que les nôtres.", "Their children are older than ours."]],
  },
  {
    id: "double-pronouns", level: "B1", category: "Pronouns",
    title: "Two pronouns together", short: "je te le donne, je le lui donne",
    explain: [
      "When two object pronouns go together, the order is fixed: me / te / nous / vous, then le / la / les, then lui / leur, then y, then en.",
      "So: Il me le donne, but Il le lui donne.",
    ],
    table: [["1st", "me, te, nous, vous"], ["2nd", "le, la, les"], ["3rd", "lui, leur"], ["4th", "y"], ["5th", "en"], ["examples", "je te le prête · je la leur envoie", true]],
    examples: [["Tu me prêtes ton vélo ? — Oui, je te le prête.", "Can you lend me your bike? — Yes, I’ll lend it to you."], ["La lettre ? Je la lui ai envoyée.", "The letter? I sent it to him."], ["Il y en a beaucoup.", "There are lots of them."]],
  },
  {
    id: "pronominal-pc", level: "B1", category: "Verbs & tenses",
    title: "Reflexive verbs in the passé composé", short: "elle s’est levée",
    explain: [
      "Reflexive verbs always use être in the passé composé: je me suis levé(e).",
      "The participle usually agrees with the subject: elle s’est levée, ils se sont amusés.",
      "No agreement if a direct object comes after the verb: Elle s’est lavé les mains.",
    ],
    table: [["il", "s’est levé"], ["elle", "s’est levée", true], ["ils", "se sont levés"], ["elles", "se sont levées", true], ["+ object after", "elle s’est lavé les mains"]],
    examples: [["Je me suis réveillée tard.", "I woke up late."], ["Ils se sont rencontrés à Paris.", "They met in Paris."], ["Nous nous sommes bien amusés.", "We had a great time."]],
  },
  {
    id: "plus-que-parfait", level: "B1", category: "Verbs & tenses",
    title: "Plus-que-parfait", short: "j’avais fini, elle était partie",
    explain: [
      "The plus-que-parfait describes an action that happened before another past action: had done.",
      "It’s avoir or être in the imparfait + past participle. Same agreement rules as the passé composé.",
    ],
    table: [["avoir", "j’avais mangé"], ["être", "elle était partie", true], ["reflexive", "il s’était levé"]],
    examples: [["Quand je suis arrivée, le film avait commencé.", "When I arrived, the film had started."], ["Il était déjà parti.", "He had already left."], ["Elle m’a dit qu’elle avait fini.", "She told me she had finished."]],
  },
  {
    id: "conditionnel", level: "B1", category: "Verbs & tenses",
    title: "Present conditional", short: "je voudrais, j’aimerais",
    explain: [
      "Future stem + imparfait endings: -ais, -ais, -ait, -ions, -iez, -aient. Je parlerais, je serais, j’irais.",
      "Use it to be polite (Je voudrais un café), to give advice (Tu devrais dormir), to express wishes (J’aimerais voyager) and with si + imparfait.",
    ],
    table: [["parler", "je parlerais"], ["être", "je serais", true], ["avoir", "j’aurais", true], ["vouloir", "je voudrais", true], ["pouvoir", "je pourrais"], ["devoir", "tu devrais"]],
    examples: [["Je voudrais une baguette, s’il vous plaît.", "I’d like a baguette, please."], ["Tu devrais te reposer.", "You should rest."], ["Ce serait génial !", "That would be great!"]],
  },
  {
    id: "si-clauses", level: "B1", category: "Verbs & tenses",
    title: "If sentences", short: "si + présent → futur, si + imparfait → conditionnel",
    explain: [
      "Real possibility: si + présent, then futur (or présent, impératif). S’il fait beau, on ira à la plage.",
      "Imaginary situation: si + imparfait, then conditionnel. Si j’étais riche, je voyagerais.",
      "Never put the futur or the conditionnel right after si. Si + il becomes s’il.",
    ],
    table: [["si + présent", "→ futur", true], ["si + imparfait", "→ conditionnel", true], ["si + plus-que-parfait", "→ conditionnel passé (B2)"]],
    examples: [["Si tu viens, je serai contente.", "If you come, I’ll be happy."], ["Si j’avais le temps, j’apprendrais le piano.", "If I had time, I’d learn the piano."], ["S’il pleut, on restera ici.", "If it rains, we’ll stay here."]],
  },
  {
    id: "subjonctif", level: "B1", category: "Verbs & tenses",
    title: "Present subjunctive: forms", short: "il faut que je parte",
    explain: [
      "Take the ils form of the present, remove -ent, and add -e, -es, -e, -ions, -iez, -ent: ils finissent → que je finisse.",
      "Common irregulars: être (que je sois), avoir (que j’aie), aller (que j’aille), faire (que je fasse), pouvoir (que je puisse), savoir (que je sache), vouloir (que je veuille).",
    ],
    table: [["parler", "que je parle, que nous parlions"], ["finir", "que je finisse"], ["prendre", "que je prenne, que nous prenions"], ["être", "que je sois", true], ["avoir", "que j’aie", true], ["faire", "que je fasse", true]],
    examples: [["Il faut que tu viennes.", "You have to come."], ["Je veux que vous soyez heureux.", "I want you to be happy."], ["Il faut que je fasse les courses.", "I have to do the shopping."]],
  },
  {
    id: "subjonctif-use", level: "B1", category: "Sentences",
    title: "Subjunctive or indicative", short: "je pense que… · je ne pense pas que…",
    explain: [
      "Use the subjunctive after expressions of necessity, will, emotion, doubt and possibility: il faut que, je veux que, je suis content que, je doute que, il est possible que.",
      "Also after bien que, pour que, avant que, à condition que.",
      "Use the indicative for certainty and opinion: je sais que, je pense que, je crois que, il est sûr que, j’espère que. But a negative opinion takes the subjunctive: je ne pense pas qu’il soit là.",
    ],
    table: [["necessity, will", "il faut que, je veux que → subj.", true], ["emotion, doubt", "je suis triste que, je doute que → subj.", true], ["bien que, pour que, avant que", "→ subj.", true], ["certainty, opinion", "je sais que, je pense que → indic."], ["espérer, après que", "→ indic."]],
    examples: [["Je suis contente que tu sois là.", "I’m glad you’re here."], ["Je pense qu’il a raison.", "I think he’s right."], ["Bien qu’il fasse froid, on sort.", "Although it’s cold, we’re going out."]],
  },
  {
    id: "gerondif", level: "B1", category: "Verbs & tenses",
    title: "Gérondif", short: "en marchant, en faisant",
    explain: [
      "En + present participle. Take the nous form of the present, replace -ons with -ant: nous parlons → en parlant.",
      "It means while or by doing something, and the subject is the same as in the main clause: Il chante en cuisinant.",
      "Irregular: être → en étant, avoir → en ayant, savoir → en sachant.",
    ],
    table: [["nous parlons", "en parlant"], ["nous finissons", "en finissant"], ["nous faisons", "en faisant"], ["être / avoir / savoir", "étant, ayant, sachant", true]],
    examples: [["Je lis en mangeant.", "I read while eating."], ["C’est en forgeant qu’on devient forgeron.", "Practice makes perfect."], ["Il s’est blessé en tombant.", "He hurt himself falling."]],
  },
  {
    id: "verb-prepositions", level: "B1", category: "Prepositions",
    title: "Verbs + à / de + infinitive", short: "commencer à, arrêter de, vouloir —",
    explain: [
      "Before an infinitive, some verbs need à, some need de, and some need nothing at all. Learn each verb with its preposition.",
      "With à: commencer, apprendre, réussir, continuer, hésiter, s’habituer. With de: décider, arrêter, essayer, oublier, refuser, accepter. Nothing: vouloir, pouvoir, devoir, savoir, aimer, préférer, aller, espérer.",
    ],
    table: [["+ à", "J’apprends à nager.", true], ["+ de", "J’ai décidé de partir.", true], ["no preposition", "Je veux partir."], ["de + vowel", "Il a oublié d’appeler."]],
    examples: [["Il a commencé à pleuvoir.", "It started to rain."], ["Arrête de crier !", "Stop shouting!"], ["J’espère te voir bientôt.", "I hope to see you soon."]],
  },
  {
    id: "relative-ou-dont", level: "B1", category: "Sentences",
    title: "Relative pronouns: où, dont", short: "la ville où…, le livre dont…",
    explain: [
      "Où refers to a place or a time: la ville où je suis née, le jour où je t’ai rencontré.",
      "Dont replaces de + noun: parler de, avoir besoin de, être fier de… Le livre dont je parle. It also shows possession: l’homme dont la fille est médecin (whose daughter).",
    ],
    table: [["place", "la maison où j’habite", true], ["time", "le jour où il est parti", true], ["de + noun", "le film dont tu parles"], ["whose", "l’ami dont le père est pilote"]],
    examples: [["C’est le café où on s’est rencontrés.", "It’s the café where we met."], ["Voici le livre dont j’ai besoin.", "Here’s the book I need."], ["J’ai une amie dont le frère est acteur.", "I have a friend whose brother is an actor."]],
  },
  {
    id: "ce-qui-ce-que", level: "B1", category: "Sentences",
    title: "Ce qui, ce que, ce dont", short: "what (the thing that)",
    explain: [
      "These mean what or the thing that, when there’s no noun before them.",
      "Ce qui is the subject of the next verb, ce que (ce qu’) the object, ce dont replaces de + thing.",
    ],
    table: [["subject", "Ce qui m’intéresse, c’est…", true], ["object", "Dis-moi ce que tu veux.", true], ["de + thing", "C’est ce dont j’ai besoin."]],
    examples: [["Je ne sais pas ce qui s’est passé.", "I don’t know what happened."], ["Fais ce que tu veux.", "Do what you want."], ["Voilà ce dont je parlais.", "That’s what I was talking about."]],
  },
  {
    id: "indefinites", level: "B1", category: "Sentences",
    title: "Indefinite words", short: "quelqu’un, quelque chose, chaque, chacun…",
    explain: [
      "Quelqu’un (somebody), quelque chose (something), quelque part (somewhere) and their negatives personne, rien, nulle part.",
      "Chaque + singular noun (each) is an adjective; chacun / chacune (each one) is a pronoun. Quelques (a few), plusieurs (several), certains / certaines (some), aucun / aucune (not any).",
    ],
    table: [["somebody / nobody", "quelqu’un / personne"], ["something / nothing", "quelque chose / rien"], ["each", "chaque jour", true], ["each one", "chacun, chacune", true], ["a few / several", "quelques / plusieurs"]],
    examples: [["Chaque matin, je cours.", "Every morning I run."], ["Il y a quelqu’un ?", "Is anybody there?"], ["Chacun fait ce qu’il veut.", "Everyone does what they want."]],
  },

  // ───────────────────────── B2 ─────────────────────────
  {
    id: "futur-anterieur", level: "B2", category: "Verbs & tenses",
    title: "Futur antérieur", short: "j’aurai fini, elle sera partie",
    explain: [
      "The futur antérieur describes an action that will be finished before another future moment: will have done.",
      "Avoir or être in the futur simple + past participle. Often after quand, dès que, lorsque: Quand tu auras fini, appelle-moi.",
    ],
    table: [["avoir", "j’aurai mangé"], ["être", "elle sera partie", true], ["after quand", "Quand il sera arrivé, on dînera.", true]],
    examples: [["J’aurai fini avant midi.", "I’ll have finished before noon."], ["Dès que tu seras rentré, on partira.", "As soon as you’re back, we’ll leave."], ["Dans dix ans, ils auront construit le pont.", "In ten years, they’ll have built the bridge."]],
  },
  {
    id: "conditionnel-passe", level: "B2", category: "Verbs & tenses",
    title: "Past conditional", short: "j’aurais aimé, si j’avais su…",
    explain: [
      "Avoir or être in the conditionnel + past participle: would have done.",
      "Use it for regrets (J’aurais dû partir), reproaches, and with si + plus-que-parfait: Si j’avais su, je serais venu.",
    ],
    table: [["avoir", "j’aurais fait"], ["être", "elle serait venue", true], ["regret", "J’aurais dû…", true], ["si + plus-que-parfait", "→ conditionnel passé"]],
    examples: [["Si tu m’avais appelé, je serais venue.", "If you had called me, I would have come."], ["J’aurais aimé te voir.", "I would have liked to see you."], ["Tu aurais dû me le dire.", "You should have told me."]],
  },
  {
    id: "pp-agreement-avoir", level: "B2", category: "Verbs & tenses",
    title: "Agreement with avoir", short: "les fleurs que j’ai achetées",
    explain: [
      "With avoir, the participle normally doesn’t agree with the subject. But it agrees with the direct object if the object comes before the verb.",
      "That happens with object pronouns (je l’ai vue), que (la robe que j’ai achetée) and quel / combien de questions (Quelles villes as-tu visitées ?).",
    ],
    table: [["object after", "J’ai acheté les fleurs."], ["pronoun before", "Je les ai achetées.", true], ["que before", "les fleurs que j’ai achetées", true], ["quel + noun", "Quelle robe as-tu choisie ?"]],
    examples: [["La lettre ? Je l’ai écrite hier.", "The letter? I wrote it yesterday."], ["Les photos que tu as prises sont belles.", "The photos you took are beautiful."]],
  },
  {
    id: "passive", level: "B2", category: "Verbs & tenses",
    title: "Passive voice", short: "le livre a été écrit par…",
    explain: [
      "Être in the needed tense + past participle, which agrees with the subject. The agent is introduced by par (or de with feelings and states).",
      "The tense is carried by être: est construit (present), a été construit (passé composé), sera construit (future).",
      "French often prefers on or a reflexive verb instead: On parle français ici. Ça se mange froid.",
    ],
    table: [["present", "La maison est construite."], ["passé composé", "La maison a été construite.", true], ["future", "La maison sera construite."], ["agent", "par l’architecte"], ["feelings", "Elle est aimée de tous."]],
    examples: [["Ce tableau a été peint par Monet.", "This painting was painted by Monet."], ["Les résultats seront publiés demain.", "The results will be published tomorrow."]],
  },
  {
    id: "lequel", level: "B2", category: "Pronouns",
    title: "Lequel, auquel, duquel", short: "la table sur laquelle…",
    explain: [
      "After a preposition, use lequel, laquelle, lesquels, lesquelles to refer to things: la table sur laquelle…",
      "With à and de they contract: auquel, auxquels, auxquelles; duquel, desquels, desquelles. À laquelle and de laquelle don’t contract.",
      "Lequel also asks which one: Lequel préfères-tu ?",
    ],
    table: [["masculine", "lequel · auquel · duquel"], ["feminine", "laquelle · à laquelle · de laquelle"], ["masc. plural", "lesquels · auxquels · desquels"], ["fem. plural", "lesquelles · auxquelles · desquelles"]],
    examples: [["C’est la raison pour laquelle je suis venu.", "That’s the reason why I came."], ["Le projet auquel je pense est ambitieux.", "The project I’m thinking of is ambitious."], ["Lequel veux-tu ?", "Which one do you want?"]],
  },
  {
    id: "reported-speech", level: "B2", category: "Sentences",
    title: "Reported speech", short: "il a dit qu’il était fatigué",
    explain: [
      "After a reporting verb in the present, tenses don’t change. After one in the past, they shift back: présent → imparfait, passé composé → plus-que-parfait, futur → conditionnel.",
      "Questions: est-ce que → si, qu’est-ce que → ce que, qu’est-ce qui → ce qui. Orders: dire de + infinitive.",
      "Time words shift too: demain → le lendemain, hier → la veille, ici → là.",
    ],
    table: [["présent", "→ imparfait", true], ["passé composé", "→ plus-que-parfait", true], ["futur", "→ conditionnel", true], ["est-ce que", "→ si"], ["demain / hier", "→ le lendemain / la veille"]],
    examples: [["Il a dit qu’il viendrait.", "He said he would come."], ["Elle m’a demandé si j’avais faim.", "She asked me if I was hungry."], ["Il m’a dit de partir.", "He told me to leave."]],
  },
  {
    id: "connectors", level: "B2", category: "Sentences",
    title: "Linking words", short: "bien que, malgré, pourtant, donc…",
    explain: [
      "Cause: car, parce que, grâce à (good cause), à cause de (bad cause). Consequence: donc, alors, par conséquent.",
      "Contrast: mais, pourtant, cependant, alors que, tandis que, bien que (+ subjunctive), malgré (+ noun), même si (+ indicative).",
      "Goal: pour, afin de (+ infinitive), pour que, afin que (+ subjunctive). Condition: si, à condition que (+ subjunctive).",
    ],
    table: [["although", "bien que + subj. · malgré + noun", true], ["however", "pourtant, cependant"], ["so", "donc, par conséquent"], ["thanks to / because of", "grâce à / à cause de"], ["so that", "pour que, afin que + subj.", true]],
    examples: [["Malgré la pluie, on est sortis.", "Despite the rain, we went out."], ["Il est malade, pourtant il travaille.", "He’s ill, yet he’s working."], ["Je t’explique pour que tu comprennes.", "I’m explaining so that you understand."]],
  },
  {
    id: "passe-simple", level: "B2", category: "Verbs & tenses",
    title: "Passé simple (to recognise)", short: "il fut, elle alla, ils vinrent",
    explain: [
      "The passé simple is the literary past tense, used in novels, tales and history books. In speech, the passé composé replaces it.",
      "You mostly need to recognise the il / elle and ils / elles forms: -er verbs → il parla, ils parlèrent; -ir / -re → il finit, ils finirent; many irregulars → il fut, il eut, il fit, il vint.",
    ],
    table: [["parler", "il parla · ils parlèrent"], ["finir", "il finit · ils finirent"], ["être", "il fut · ils furent", true], ["avoir", "il eut · ils eurent", true], ["faire", "il fit · ils firent"], ["venir", "il vint · ils vinrent"]],
    examples: [["Il était une fois un roi qui eut trois filles.", "Once upon a time there was a king who had three daughters."], ["Elle ouvrit la porte et sortit.", "She opened the door and went out."]],
  },
  {
    id: "mise-en-relief", level: "B2", category: "Sentences",
    title: "Emphasis: c’est … qui / que", short: "c’est moi qui…, ce qui…, c’est…",
    explain: [
      "To highlight part of a sentence, frame it with c’est … qui (for the subject) or c’est … que (for anything else).",
      "After c’est moi qui, the verb agrees with the pronoun: C’est moi qui ai raison. C’est toi qui es en retard.",
      "Ce qui / ce que …, c’est … puts the idea first: Ce que j’aime, c’est voyager.",
    ],
    table: [["subject", "C’est Paul qui a gagné.", true], ["other parts", "C’est demain que je pars.", true], ["pronoun", "C’est nous qui avons appelé."], ["idea first", "Ce qui compte, c’est la santé."]],
    examples: [["C’est elle qui m’a aidée.", "She’s the one who helped me."], ["C’est à toi que je parle.", "It’s you I’m talking to."], ["Ce que je veux, c’est du repos.", "What I want is rest."]],
  },
];

export const RULE_MAP = new Map(RULES.map((r) => [r.id, r]));
