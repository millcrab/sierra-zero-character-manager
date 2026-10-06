import { talents } from "../data/canonical";
import { canPurchaseNode, removeNodeWithCascade } from "../engine/rules";
import type { SpecializationRecord } from "../types";

interface TalentTreeProps {
  specialization: SpecializationRecord;
  purchasedIds: string[];
  availableXp: number;
  interactive: boolean;
  onChange: (ids: string[]) => void;
}

export function TalentTree({ specialization, purchasedIds, availableXp, interactive, onChange }: TalentTreeProps) {
  const purchased = new Set(purchasedIds);

  const toggle = (nodeId: string, cost: number) => {
    if (!interactive) return;
    if (purchased.has(nodeId)) {
      const result = removeNodeWithCascade(specialization, purchased, nodeId);
      onChange([...result.remaining]);
      return;
    }
    if (availableXp >= cost && canPurchaseNode(specialization, purchased, nodeId)) {
      onChange([...purchased, nodeId]);
    }
  };

  return (
    <section className="talent-tree" aria-label={`${specialization.name} talent tree`}>
      {specialization.nodes.map((node) => {
        const talent = talents.find((candidate) => candidate.id === node.talentId)!;
        const isPurchased = purchased.has(node.id);
        const isAvailable = canPurchaseNode(specialization, purchased, node.id) && availableXp >= node.cost;
        return (
          <button
            type="button"
            key={node.id}
            className={`talent-node ${isPurchased ? "is-purchased" : ""} ${node.defining ? "is-defining" : ""}`}
            style={{ gridColumn: node.column, gridRow: node.row }}
            disabled={interactive && !isPurchased && !isAvailable}
            aria-pressed={isPurchased}
            onClick={() => toggle(node.id, node.cost)}
          >
            <span className="talent-node__name">{talent.name}</span>
            <span className="talent-node__rules">{talent.rules}</span>
            <span className="talent-node__cost">{node.cost} XP</span>
          </button>
        );
      })}
    </section>
  );
}
