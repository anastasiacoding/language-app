# Language App — French

A mobile-first web app (PWA) for learning French with real texts: read a passage aloud, translate it out loud, retell it in French, and keep practicing the words you missed. Also includes a grammar trainer with endless examples, a gender checker, a conjugator and a list of irregular verbs.

Live: https://anastasiacoding.github.io/language-app/

## Stack

- React + TypeScript + Vite, installable as a PWA (`vite-plugin-pwa`)
- Supabase (EU, Frankfurt) for auth and data, protected with Row Level Security
- Web Speech API for speech recognition (the browser's own service; audio is never stored by the app)
- Tesseract.js for on-device text recognition from photos
- MyMemory for free FR → EN machine translation
- Montserrat, self-hosted via `@fontsource` (SIL Open Font License)
- Word data from Wiktionary (via kaikki.org) and Lexique 3.83, both CC BY-SA 4.0 — see `src/data/DATA-LICENSE.md`

## Develop

```bash
npm install
npm run dev        # http://localhost:5173/language-app/
npm run typecheck
npm run build
```

Pushing to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`.

## Database

Tables: `profiles`, `consents`, `texts`, `sessions`, `words`, `favorites`. Every table has RLS so users only see their own rows. `delete_my_account()` lets a signed-in user delete their account and all data.
