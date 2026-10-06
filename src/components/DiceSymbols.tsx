import type { ReactNode } from "react";
import type { DicePool } from "../types";

type DieType = "ability" | "proficiency" | "boost" | "difficulty" | "challenge" | "setback";

const dieLabels: Record<DieType, string> = {
  ability: "Ability die",
  proficiency: "Proficiency die",
  boost: "Boost die",
  difficulty: "Difficulty die",
  challenge: "Challenge die",
  setback: "Setback die"
};

const countWords: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5
};

const dicePattern = /\b(?:(a|an|one|two|three|four|five|[1-5])\s+)?(Ability|Proficiency|Boost|Difficulty|Challenge|Setback)\s+(?:die|dice|dies)\b/gi;

export function DiceIcon({ type }: { type: DieType }) {
  return <span className={`die-icon die-icon--${type}`} aria-hidden="true" />;
}

function DiceGroup({ type, count = 1, label }: { type: DieType; count?: number; label?: string }) {
  return <span className="dice-group" role="img" aria-label={label ?? `${count} ${count === 1 ? dieLabels[type] : `${dieLabels[type].replace(" die", "")} dice`}`}>
    {Array.from({ length: count }, (_, index) => <DiceIcon key={`${type}-${index}`} type={type} />)}
  </span>;
}

export function GameText({ children }: { children: string }) {
  const output: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  dicePattern.lastIndex = 0;
  while ((match = dicePattern.exec(children)) !== null) {
    if (match.index > cursor) output.push(children.slice(cursor, match.index));
    const count = match[1] ? countWords[match[1].toLowerCase()] : 1;
    const type = match[2].toLowerCase() as DieType;
    output.push(<DiceGroup key={`${match.index}-${match[0]}`} type={type} count={count} label={match[0]} />);
    cursor = match.index + match[0].length;
  }
  if (cursor < children.length) output.push(children.slice(cursor));
  return <>{output}</>;
}

export function DicePoolDisplay({ pool }: { pool: DicePool }) {
  const empty = pool.proficiency === 0 && pool.ability === 0 && pool.boosts === 0 && pool.setbacks === 0;
  if (empty) return <span className="empty-pool" aria-label="No dice">—</span>;
  return <span className="dice-pool">
    {pool.proficiency > 0 && <DiceGroup type="proficiency" count={pool.proficiency} />}
    {pool.ability > 0 && <DiceGroup type="ability" count={pool.ability} />}
    {pool.boosts > 0 && <DiceGroup type="boost" count={pool.boosts} />}
    {pool.setbacks > 0 && <DiceGroup type="setback" count={pool.setbacks} />}
  </span>;
}
