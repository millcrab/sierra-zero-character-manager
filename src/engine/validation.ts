import type { SpecializationRecord } from "../types";

export function validateSpecialization(specialization: SpecializationRecord): string[] {
  const errors: string[] = [];
  const nodeIds = new Set<string>();
  const positions = new Set<string>();
  for (const node of specialization.nodes) {
    if (nodeIds.has(node.id)) errors.push(`Duplicate node id ${node.id}`);
    nodeIds.add(node.id);
    const position = `${node.row}:${node.column}`;
    if (positions.has(position)) errors.push(`Duplicate position ${position}`);
    positions.add(position);
    if (node.cost !== node.row * 5) errors.push(`Wrong cost for ${node.id}`);
  }
  if (specialization.nodes.length !== 20) errors.push("Tree must contain exactly 20 nodes");
  for (const [left, right] of specialization.edges) {
    if (!nodeIds.has(left)) errors.push(`Edge references missing node ${left}`);
    if (!nodeIds.has(right)) errors.push(`Edge references missing node ${right}`);
    if (left === right) errors.push(`Self edge at ${left}`);
  }
  for (const entry of specialization.entryNodeIds) {
    if (!nodeIds.has(entry)) errors.push(`Missing entry node ${entry}`);
  }
  return errors;
}
