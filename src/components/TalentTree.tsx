import { talents } from "../data/canonical";
import { canPurchaseNode, removeNodeWithCascade } from "../engine/rules";
import type { SpecializationRecord } from "../types";
import { GameText } from "./DiceSymbols";

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
    <section className="talent-tree-scroller" aria-label={`${specialization.name} talent tree`}>
      <div className="talent-tree">
      {specialization.edges.map(([leftId, rightId]) => {
        const left = specialization.nodes.find((node) => node.id === leftId)!;
        const right = specialization.nodes.find((node) => node.id === rightId)!;
        const horizontal = left.row === right.row;
        const bothPurchased = purchased.has(leftId) && purchased.has(rightId);
        const onePurchased = purchased.has(leftId) || purchased.has(rightId);
        return <span
          aria-hidden="true"
          key={`${leftId}-${rightId}`}
          className={`talent-connector talent-connector--${horizontal ? "horizontal" : "vertical"} ${bothPurchased ? "is-purchased" : onePurchased ? "is-reachable" : ""}`}
          style={horizontal
            ? { gridColumn: `${Math.min(left.column, right.column)} / span 2`, gridRow: left.row }
            : { gridColumn: left.column, gridRow: `${Math.min(left.row, right.row)} / span 2` }}
        />;
      })}
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
            <span className="talent-node__rules"><GameText>{talent.rules}</GameText></span>
            <span className="talent-node__cost">{node.cost} XP</span>
          </button>
        );
      })}
      </div>
    </section>
  );
}
