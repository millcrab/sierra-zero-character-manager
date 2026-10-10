import { useState } from "react";
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
  const [expanded, setExpanded] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = specialization.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedTalent = selectedNode ? talents.find((talent) => talent.id === selectedNode.talentId) ?? null : null;

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
    <section className="talent-tree-container" aria-label={`${specialization.name} talent tree`}>
      <div className="talent-tree-toolbar"><button className="secondary" type="button" onClick={() => setExpanded((current) => !current)}>{expanded ? "Collapse all" : "Expand all"}</button><span>Tap a talent for its complete rules.</span></div>
      <div className="talent-tree-scroller" {...(expanded ? { "data-swipe-ignore": true } : {})}>
      <div className={`talent-tree ${expanded ? "is-expanded" : "is-compact"}`}>
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
            className={`talent-node ${isPurchased ? "is-purchased" : ""} ${!isPurchased && !isAvailable ? "is-unavailable" : ""} ${node.defining ? "is-defining" : ""}`}
            style={{ gridColumn: node.column, gridRow: node.row }}
            aria-disabled={interactive && !isPurchased && !isAvailable}
            aria-pressed={isPurchased}
            onClick={() => setSelectedNodeId(node.id)}
          >
            <span className="talent-node__name">{talent.name}</span>
            {expanded && <><span className="talent-node__rules"><GameText>{talent.rules}</GameText></span><span className="talent-node__cost">{node.cost} XP</span></>}
          </button>
        );
      })}
      </div>
      </div>
      {selectedNode && selectedTalent && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedNodeId(null); }}><section className="talent-dialog" role="dialog" aria-modal="true" aria-labelledby={`talent-${selectedNode.id}`}><div className="section-heading"><div><p className="eyebrow">{specialization.name} · {selectedNode.cost} XP</p><h2 id={`talent-${selectedNode.id}`}>{selectedTalent.name}</h2></div><button className="text-button" type="button" onClick={() => setSelectedNodeId(null)}>Close</button></div><p><GameText>{selectedTalent.rules}</GameText></p><p><small>{selectedTalent.ranked ? "Ranked" : "Unranked"} · {selectedTalent.activation}{selectedTalent.usage !== "none" ? ` · once per ${selectedTalent.usage}` : ""}</small></p>{interactive && <button className={purchased.has(selectedNode.id) ? "secondary" : "primary"} type="button" disabled={!purchased.has(selectedNode.id) && (availableXp < selectedNode.cost || !canPurchaseNode(specialization, purchased, selectedNode.id))} onClick={() => { toggle(selectedNode.id, selectedNode.cost); setSelectedNodeId(null); }}>{purchased.has(selectedNode.id) ? "Remove talent" : `Purchase for ${selectedNode.cost} XP`}</button>}</section></div>}
    </section>
  );
}
