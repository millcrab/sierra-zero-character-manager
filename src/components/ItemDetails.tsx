import { skills } from "../data/canonical";
import type { ItemRecord } from "../types";
import { GameText } from "./DiceSymbols";

const skillName = (id: string) => skills.find((skill) => skill.id === id)?.name ?? id;

export function ItemDetails({ item, showHeading = false }: { item: ItemRecord; showHeading?: boolean }) {
  return <div className="item-details">
    {showHeading && <h3>{item.name}</h3>}
    <p className="item-details__meta"><strong>{item.category}</strong> · {item.access} · ${item.price} · Rarity {item.rarity}{item.source ? ` · ${item.source}` : ""}</p>
    <p><GameText>{item.description}</GameText></p>
    <dl className="item-stat-grid">
      <div><dt>Encumbrance</dt><dd>{item.encumbrance}</dd></div>
      <div><dt>Hard points</dt><dd>{item.hardPoints}</dd></div>
      {item.weapon && <>
        <div><dt>Skill</dt><dd>{skillName(item.weapon.skillId)}</dd></div>
        <div><dt>Damage</dt><dd>{item.weapon.damage}</dd></div>
        <div><dt>Critical</dt><dd>{item.weapon.critical}</dd></div>
        <div><dt>Range</dt><dd>{item.weapon.range}</dd></div>
      </>}
      {item.armor && <>
        <div><dt>Defense</dt><dd>{item.armor.defense}</dd></div>
        <div><dt>Soak</dt><dd>{item.armor.soak}</dd></div>
      </>}
    </dl>
    {item.weapon && <p className="item-details__qualities"><strong>Qualities:</strong> {item.weapon.qualities.length ? item.weapon.qualities.join(", ") : "None"}</p>}
  </div>;
}
