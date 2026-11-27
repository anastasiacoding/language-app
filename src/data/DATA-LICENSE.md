# Word data

`practice.json` and `nouns-all.json` are derived from:

- **Wiktionary** (English edition), French entries, as extracted by [kaikki.org](https://kaikki.org) — licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) and GFDL. Used for genders, plurals and English glosses.
- **Lexique 3.83** by Boris New and Christophe Pallier ([lexique.org](http://www.lexique.org)) — licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Used for word frequencies.

These derived files are shared under the same licence, CC BY-SA 4.0.

- **ipa-dict** French (France) pronunciations by open-dict-data, [github.com/open-dict-data/ipa-dict](https://github.com/open-dict-data/ipa-dict) — MIT licence. Used for the IPA transcriptions (`public/ipa/`, built by `scripts/build-ipa.py`).
- **English meanings of single words**: Wiktionary (CC BY-SA 4.0), from the French-English list built by Vuizur, [github.com/Vuizur/Wiktionary-Dictionaries](https://github.com/Vuizur/Wiktionary-Dictionaries). Used in `public/gloss/`, built by `scripts/build-gloss.py`.
