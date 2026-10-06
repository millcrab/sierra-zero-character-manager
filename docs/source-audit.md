# Sierra Zero Character Manager Source Audit

## Authority order

1. Final Sierra Zero player material.
2. Genesys Core Rulebook, Expanded Player's Guide, and approved source material.
3. Construction and specialization corpus references.
4. Character Manager governing specification for product behavior and architecture.

## Confirmed corpus

- 24 archetypes.
- 6 careers.
- 36 career specializations.
- 3 universal Agent specializations.
- 39 specialization trees and 780 talent nodes.
- A Sierra Zero equipment catalogue containing weapons, armor, gear, attachments, and advanced gear.
- Personal Favor, temporary Performance, Group Favor bands, gear requisition, and internal influence rules.

## Imported application corpus

- 24 archetypes with starting characteristics, thresholds, XP, skills, and abilities.
- 6 careers and 39 specialization trees (36 career, 3 universal).
- 780 talent nodes, 257 normalized talent records, and 726 printed connectors.
- 32 skills, 125 equipment records, and 31 attachment records.
- Engine coverage: thresholds, dice pools, skill and characteristic costs, specialization costs, talent purchase legality, graph reachability, ranked talent aggregation, XP refund cascades, Favor acquisition, and attachment hard points.

## Data validation gates

- IDs are unique and stable.
- Every reference resolves.
- Every specialization has exactly 20 nodes in a unique 5 by 4 grid.
- Node cost agrees with its row.
- Every graph edge names existing nodes and is symmetric in the normalized graph.
- Every talent node can be reached from at least one legal entry through the full graph.
- Ranked talent aggregation counts purchased nodes, not unique talent IDs.
- Granted skill ranks and purchased skill ranks remain separate.
