# Sierra Zero Character Manager

Mobile-first, local-first character creation, play reference, and advancement for Sierra Zero.

## Current milestone — checkpoint 0.5

The repository contains the local-first application foundation and the complete approved mechanical data corpus: 24 archetypes, 6 careers, 39 specialization trees, 780 talent nodes, 125 items, and 31 attachments. Character creation includes reversible characteristic, skill, talent, gear, and attachment spending plus motivations and a portrait-ready profile. Play includes Dashboard, Combat, Social, Skills, Gear, and specialization reference screens; Advance includes session updates, specialization trees, skills, and profile editing. Players can export one character, back up the complete roster, and import validated backups including portraits. Remaining work is tracked in `docs/implementation-status.md`; approved rulings are recorded in `docs/ambiguities.md`.

The generated canonical data lives in `src/data/canonical.generated.ts`. Rebuild it from the supplied Sierra Zero PDFs with:

```bash
python3 scripts/import_canonical.py
```

## Commands

```bash
npm install
npm run dev
npm test
npm run build
```

The production build verifies relative GitHub Pages paths, the install manifest, full shell precaching, and the offline fallback. Pushing the repository to a GitHub `main` branch triggers `.github/workflows/deploy-pages.yml`.
