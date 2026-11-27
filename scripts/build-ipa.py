"""Split the open-dict-data/ipa-dict French list (MIT) into small per-letter files the app loads on demand.
Source: https://github.com/open-dict-data/ipa-dict (data/fr_FR.txt)"""
import json, unicodedata, os, collections
here = os.path.dirname(__file__)
out = os.path.join(here, "..", "public", "ipa")
def key(w):  # first two letters without accents, same as src/lib/dict.ts
    s = unicodedata.normalize("NFD", w.lower().replace("œ", "o").replace("æ", "a"))
    s = "".join(c for c in s if c.isalpha() and "a" <= c <= "z")
    return (s[:2] + "_")[:2] if s else "__"
shards = collections.defaultdict(dict)
for line in open(os.path.join(here, "fr_FR.ipa.txt"), encoding="utf-8"):
    w, _, ipa = line.rstrip("\n").partition("\t")
    if not w or not ipa: continue
    lw = w.lower().replace("'", "’")
    vals = [p.strip().strip("/") for p in ipa.split(",") if p.strip()]
    prev = shards[key(lw)].get(lw)
    shards[key(lw)][lw] = ", ".join(dict.fromkeys((prev.split(", ") if prev else []) + vals))
os.makedirs(out, exist_ok=True)
for f in os.listdir(out): os.remove(os.path.join(out, f))
for k, d in shards.items():
    json.dump(d, open(os.path.join(out, k + ".json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(shards), "files")
