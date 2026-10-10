import type { ArchetypeAbility, ArchetypeRecord } from "../types";

const abilityTitles: Record<string, string[]> = {
  agile: ["Focused Potential - Agility"],
  anchor: ["Share the Load", "Hold Them Together"],
  "black-sheep": ["Old Ties"],
  brilliant: ["Focused Potential - Intellect"],
  burnout: ["Practiced Overextension", "Redline"],
  chameleon: ["Social Camouflage", "Become What They Need"],
  charismatic: ["Focused Potential - Presence"],
  cunning: ["Focused Potential - Cunning"],
  everyman: ["Ready for Anything"],
  firebrand: ["Forceful Personality"],
  ghost: ["Erasure", "Tradecraft", "No Paper Trail", "Prepared Cover", "Disappear"],
  "golden-child": ["Benefit of the Doubt"],
  idealist: ["Lead by Example"],
  insider: ["Routine Access", "Institutional Fluency"],
  loner: ["Resourceful"],
  "old-hand": ["Seasoned Assistance", "Call the Play"],
  outsider: ["Unconventional Approach"],
  prodigy: ["It Comes Naturally"],
  resolute: ["Focused Potential - Willpower"],
  scion: ["Inheritance", "Claim", "Known Name", "The Name Opens Doors", "Invoke the Name"],
  skeptic: ["Not Buying It"],
  strong: ["Focused Potential - Brawn"],
  survivor: ["Tough as Nails"],
  "true-believer": ["Conviction"]
};

export interface FormattedArchetypeAbility {
  id: string;
  name: string;
  rules: string;
}

function splitRules(archetypeId: string, ability: ArchetypeAbility): FormattedArchetypeAbility[] {
  const titles = abilityTitles[archetypeId] ?? [ability.name];
  const starts = titles.map((title) => ({ title, index: ability.rules.indexOf(`${title}.`) })).filter(({ index }) => index >= 0);
  if (!starts.length) return [{ id: ability.id, name: ability.name, rules: ability.rules }];
  return starts.map(({ title, index }, position) => ({
    id: `${ability.id}-${position + 1}`,
    name: title,
    rules: ability.rules.slice(index + title.length + 1, starts[position + 1]?.index ?? ability.rules.length).trim()
  }));
}

export function formattedArchetypeAbilities(archetype: ArchetypeRecord): FormattedArchetypeAbility[] {
  return archetype.abilities.flatMap((ability) => splitRules(archetype.id, ability));
}
