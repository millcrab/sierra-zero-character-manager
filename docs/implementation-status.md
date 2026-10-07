# Implementation Status

## Completed through checkpoint 0.8

- React, TypeScript, and Vite foundation.
- Relative production paths for GitHub Pages repository hosting.
- Installable PWA manifest, generated icons, service-worker registration, and build-time precache generation.
- IndexedDB character and draft storage.
- Versioned character state separating granted ranks from XP purchases.
- Reproducible source importer for the approved archetype, career, specialization, and item PDFs.
- Canonical typed records for all 24 archetypes, 6 careers, 39 specialization trees, 780 talent nodes, 257 talents, 32 skills, 125 items, and 31 attachments.
- All 726 printed specialization connectors transcribed from the source PDFs and treated as mechanically two-way.
- Pure rules functions for characteristics, thresholds, skill pools, XP costs, talent aggregation, Favor cost, purchase legality, reachability, and graph-aware removal/refunds.
- Working mobile flow for roster, six-step initial creation, Summary, six Play subsections, and four Advance subsections.
- Data-driven archetype, career, starting-specialization, equipment, attachment, and additional-specialization selection.
- Multi-part archetype construction support, including Ghost and Scion option packages, Prodigy career-skill grants, and Everyman noncareer-skill filtering.
- Starting-skill selection for one archetype rank, four career ranks, and two starting-specialization ranks, including legal double selection up to rank 2.
- 500-credit creation budget and a working gear-acquisition step using cash or Favor.
- Installed attachment state, eligibility checks, remaining hard-point enforcement, and base-effect display.
- Controlled, Restricted, Illegal, and Advanced acquisition policy in the rules engine.
- End-of-session update UI accepting final XP and Favor changes, clamping Favor to 0-100, and clearing once-per-session usage state.
- Escalating specialization acquisition-cost accounting with universal specializations treated as in-career.
- Explicitly two-way specialization-tree connector behavior.
- Reversible starting-characteristic and skill XP purchases with legal rank caps and granted-rank floors.
- Post-creation skill advancement with exact next-rank costs and round-trip refunds.
- Dashboard, Combat, Social, Skills, Gear, and specialization-reference Play screens.
- Wound and strain controls, encounter reset, turn checklist, and committed/refundable extra-maneuver strain behavior.
- Equipped armor Soak/Defense derivation and a three-equipped-weapon limit with weapon pool cards.
- CRB-list motivation selectors with expandable reference text, agent-specific detail, and shared Summary, Social, and Profile display.
- Single-character export, complete-roster backup, automatic session-update backup, and validated newest-wins multi-file import with portrait data included.
- Safe rejection of unsupported schemas and unknown archetype, career, specialization, skill, talent-node, and item IDs.
- Exact draft refunds for cash- and Favor-purchased gear and attachments; reward items refund no resources.
- Build-time checks for relative GitHub Pages paths, PWA scope, complete application-shell precaching, and offline navigation fallback.
- Twenty-four passing rules-engine, graph, source-count, cross-reference, equipment, turn-state, migration, refund, and transfer tests.
- Complete GitHub Pages deployment workflow, `.nojekyll` output, and public deployment.
- Three compact equipment-category selectors for weapons, armor, and general gear.
- Visible two-way connector paths on all specialization trees, with reachable and purchased path states.
- Expandable inventory entries with attachment management isolated in a focused modification dialog.
- Colored geometric Ability, Proficiency, Boost, Difficulty, Challenge, and Setback dice symbols in pools and rules text.
- Android/PWA back-button history across the roster, character modes, Play and Advance tabs, and creation steps.
- Mobile-contained specialization trees that scroll horizontally without forcing the full page beyond the phone viewport.
- Full-cover launch gate shown once per fresh app launch.
- Confirmed character deletion from the local roster.
- Compact four-column specialization maps with bidirectional paths, tappable full-rules dialogs, and per-tree expanded mode.
- Global searchable, alphabetized, and tabbed Manual reference for setting rules and the complete mechanical corpus.
- User-controlled PWA update notification, installed-version display, and update-and-restart action.
- Explicit creation choice between 10 starting Favor and 10 bonus starting XP, with safe switching rules.
- Full manual-grade statistics in creation and Play equipment previews and expanded inventory entries.
- Signed Play money adjustment control and opaque compact talent nodes that keep connectors behind text.
- Timestamp-aware backup merging that deduplicates matching character IDs and preserves the newest record.

## Deliberately deferred

- Mechanical automation for every free-form talent and attachment effect; source rules remain visible even where automation is not appropriate.
- Migration functions for a future schema version; checkpoint 0.8 remains schema version 1, normalizes legacy motivation strings, and safely rejects newer imports.
- Manual/GM-created custom items.
- Final player-facing career and specialization descriptions during bulk data import.
- Real-device installation, offline relaunch, update, accessibility, and complete acceptance-scenario testing.

## Validation commands

```bash
npm test
npm run build
```
