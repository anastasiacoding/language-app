"""Short English meanings for French words, from Wiktionary (CC BY-SA 4.0) via
github.com/Vuizur/Wiktionary-Dictionaries ("French-English Wiktionary dictionary.tsv").
Every inflected form points to its headword's first meanings. Split by the first two letters."""
import re, json, os, html, unicodedata, collections
here = os.path.dirname(__file__)
out = os.path.join(here, "..", "public", "gloss")
POS_SKIP = {"name", "prefix", "suffix", "punct", "symbol", "character", "abbrev", "phrase", "proverb", "letter"}

def clean(li):
    t = html.unescape(re.sub(r"<[^>]+>", "", li))
    t = re.sub(r"\s*\([^()]*\)", "", t)          # (labels) and (explanations)
    t = re.sub(r"\s*\([^()]*\)", "", t)
    t = re.sub(r"\s+", " ", t).strip(" .;:,")
    if re.match(r"^(plural|feminine|masculine|inflection|alternative|obsolete|archaic|first|second|third|present|past|imperfect|singular|misspelling|nonstandard|eye dialect|abbreviation|initialism|synonym)\b.* of\b", t, re.I):
        return ""
    return t

def gloss(defs):
    blocks = re.split(r"<br><br>", defs)
    for b in blocks:
        m = re.match(r"<i>([^<]*)</i>", b)
        pos = m.group(1) if m else ""
        if pos in POS_SKIP: continue
        senses = [clean(x) for x in re.findall(r"<li>(.*?)</li>", b)]
        senses = [s for s in senses if s and len(s) < 60]
        if senses:
            items, seen = [], set()
            for part in re.split(r"[;,] ", "; ".join(senses[:3])):
                part = part.strip()
                k = re.sub(r"^to ", "", part.lower())
                if part and k not in seen:
                    seen.add(k); items.append(part)
            g = ""
            for it in items[:3]:
                if g and len(g) + len(it) > 45: break
                g = it if not g else g + ", " + it
            return g
    return ""

def key(w):
    s = unicodedata.normalize("NFD", w.lower().replace("œ", "o").replace("æ", "a"))
    s = "".join(c for c in s if c.isalpha() and "a" <= c <= "z")
    return (s[:2] + "_")[:2] if s else "__"

words = {}
lemma = {}
for line in open(os.path.join(here, "fr-en.wiktionary.tsv"), encoding="utf-8"):
    head, _, defs = line.rstrip("\n").partition("\t")
    names = head.split("|")
    g = gloss(defs)
    if not g: continue
    hw = names[0].lower().replace("'", "’")
    if " " in hw or not re.match(r"^[a-zàâäéèêëîïôöùûüçœæ’\-]+$", hw): continue
    words[hw] = g  # headwords win
    for f in names[1:]:
        f = f.lower().replace("'", "’")
        if " " in f or not re.match(r"^[a-zàâäéèêëîïôöùûüçœæ’\-]+$", f) or f == hw: continue
        lemma.setdefault(f, hw)
shards = collections.defaultdict(dict)
for w, g in words.items(): shards[key(w)][w] = g
n_forms = 0
for f, hw in lemma.items():
    if f in words:
        shards[key(f)][f] = words[f] + "||=" + hw  # e.g. est: east, and a form of être
        continue
    shards[key(f)][f] = "=" + hw  # pointer to the headword
    n_forms += 1
os.makedirs(out, exist_ok=True)
for f in os.listdir(out): os.remove(os.path.join(out, f))
for k, d in shards.items():
    json.dump(d, open(os.path.join(out, k + ".json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("headwords", len(words), "forms", n_forms, "files", len(shards))
for w in ["excitant", "excitante", "afin", "éviter", "évite", "détendre", "perturber", "visualisation", "appréhension", "grenouille", "chats", "parlent", "souvent", "est", "aux"]:
    v = shards[key(w)].get(w)
    if v and "=" in v: v = v + " → " + words.get(v.split("=")[-1], "?")
    print(w, "→", v)
