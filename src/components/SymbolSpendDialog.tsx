import { useEffect, useId } from "react";
import { symbolSpendReferences } from "../data/symbolSpends";
import type { EncounterKind, SymbolSpend } from "../data/symbolSpends";
import { NarrativeSymbolIcon } from "./NarrativeSymbolIcon";

function CostBadge({ spend }: { spend: SymbolSpend }) {
  const { count, symbol } = spend.cost;
  return <span className={`symbol-cost symbol-cost--${symbol}`}><span className="symbol-count">{count}</span><NarrativeSymbolIcon symbol={symbol} /></span>;
}

function SpendList({ title, spends, tone }: { title: string; spends: SymbolSpend[]; tone: "positive" | "negative" }) {
  return <section className={`symbol-spend-group symbol-spend-group--${tone}`}>
    <h3>{title}</h3>
    <table className="symbol-spend-list"><tbody>{spends.map((spend) => <tr key={spend.id}>
      <th scope="row"><CostBadge spend={spend} /></th>
      <td>{spend.effect}</td>
    </tr>)}</tbody></table>
  </section>;
}

export function SymbolSpendDialog({ scene, onClose }: { scene: EncounterKind; onClose: () => void }) {
  const reference = symbolSpendReferences[scene];
  const titleId = useId();

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="symbol-spend-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="section-heading">
        <div><p className="eyebrow">Narrative dice reference</p><h2 id={titleId}>{reference.title}</h2></div>
        <button className="text-button" type="button" onClick={onClose}>Close</button>
      </div>
      <p className="symbol-spend-intro">Choose effects after symbols cancel. The table costs are guidance; the fiction and the GM determine what makes sense.</p>
      <div className="symbol-spend-columns">
        <SpendList title="Positive results" spends={reference.positive} tone="positive" />
        <SpendList title="Complications" spends={reference.negative} tone="negative" />
      </div>
      <aside className="symbol-spend-reminders"><h3>Remember</h3><ul>{reference.reminders.map((reminder) => <li key={reminder}>{reminder}</li>)}</ul></aside>
      <p className="symbol-spend-source">Compiled and paraphrased from {reference.source}.</p>
    </section>
  </div>;
}
