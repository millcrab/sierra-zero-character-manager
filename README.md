# Sierra Zero Character Manager

Mobile-first, local-first character creation, play reference, and advancement for Sierra Zero.

Live app: https://millcrab.github.io/sierra-zero-character-manager/

## Current milestone — checkpoint 0.8

The repository contains the local-first application foundation and the complete approved mechanical data corpus: 24 archetypes, 6 careers, 39 specialization trees, 780 talent nodes, 125 items, and 31 attachments. Character creation includes reversible characteristic, skill, talent, gear, and attachment spending plus motivations and a portrait-ready profile. Play includes Dashboard, Combat, Social, Skills, Gear, and specialization reference screens; Advance includes session updates, specialization trees, skills, and profile editing. Players can export one character, back up the complete roster, and import validated backups including portraits. Remaining work is tracked in `docs/implementation-status.md`; approved rulings are recorded in `docs/ambiguities.md`.

Checkpoint 0.8 adds the explicit 10 Favor/10 XP starting choice, full manual-grade item previews in creation and Play, signed money adjustments, opaque compact talent nodes, CRB motivation selectors with expandable references and personal detail, automatic timestamped backups on session update, and newest-wins multi-file backup import. It retains the launch cover, deletion controls, searchable Manual, compact specialization maps, Android/PWA history, and offline update system introduced in earlier checkpoints.

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
