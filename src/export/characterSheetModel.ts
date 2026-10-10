import { archetypes, attachments, careers, items, skills, specializations, talents } from "../data/canonical";
import { formattedArchetypeAbilities } from "../data/archetypeFormatting";
import { findMotivationOption, motivationKeys, motivationLabels } from "../data/motivations";
import { availableXp, defenses, derivedCharacteristics, skillPool, skillRank, talentRanks, thresholds } from "../engine/rules";
import type { Character } from "../types";

const find = <T extends { id: string }>(records: T[], id: string) => records.find((record) => record.id === id)!;

export interface CharacterSheetModel {
  name: string;
  fileCode: string;
  portraitDataUrl: string | null;
  portraitFocusY: number;
  identity: string;
  characteristics: Array<{ name: string; value: number }>;
  status: Array<{ label: string; value: string }>;
  motivations: Array<{ label: string; name: string; detail: string; description: string }>;
  abilities: Array<{ name: string; rules: string }>;
  skills: Array<{ name: string; characteristic: string; rank: number; dice: { proficiency: number; ability: number } }>;
  talents: Array<{ name: string; rank: number; activation: string; rules: string }>;
  specializations: Array<{
    name: string;
    nodes: Array<{ id: string; name: string; row: number; column: number; cost: number; defining: boolean; purchased: boolean }>;
    edges: Array<readonly [string, string]>;
  }>;
  equipment: Array<{ name: string; category: string; equipped: boolean; stats: string; description: string; attachments: string[] }>;
  backstory: string;
}

function itemStats(item: (typeof items)[number]) {
  if (item.weapon) return `Damage ${item.weapon.damage} | Critical ${item.weapon.critical || "-"} | Range ${item.weapon.range} | ${item.weapon.qualities.join(", ") || "No qualities"}`;
  if (item.armor) return `Soak +${item.armor.soak} | Defense ${item.armor.defense} | Hard points ${item.hardPoints}`;
  return `Encumbrance ${item.encumbrance} | Hard points ${item.hardPoints} | Rarity ${item.rarity}`;
}

export function createCharacterSheetModel(character: Character): CharacterSheetModel {
  const archetype = find(archetypes, character.build.archetypeId);
  const career = find(careers, character.build.careerId);
  const specs = character.build.specializationIds.map((id) => find(specializations, id).name);
  const characteristicValues = derivedCharacteristics(character);
  const thresholdValues = thresholds(character);
  const defenseValues = defenses(character);
  const ranks = talentRanks(character);
  const purchasedNodeIds = new Set(character.build.purchases.talentNodeIds);
  return {
    name: character.profile.name || "Unnamed Agent",
    fileCode: `SZ-${character.id.slice(0, 8).toUpperCase()}`,
    portraitDataUrl: character.profile.portraitDataUrl,
    portraitFocusY: character.profile.portraitFocusY ?? 50,
    identity: `${archetype.name} / ${career.name} / ${specs.join(" / ")}`,
    characteristics: Object.entries(characteristicValues).map(([name, value]) => ({ name, value })),
    status: [
      { label: "Wounds", value: `${character.resources.wounds} / ${thresholdValues.wounds}` },
      { label: "Strain", value: `${character.resources.strain} / ${thresholdValues.strain}` },
      { label: "Soak", value: String(thresholdValues.soak) },
      { label: "Melee defense", value: String(defenseValues.melee) },
      { label: "Ranged defense", value: String(defenseValues.ranged) },
      { label: "Available XP", value: String(availableXp(character)) },
      { label: "Favor", value: String(character.resources.favor) },
      { label: "Money", value: `$${character.resources.money.toLocaleString()}` }
    ],
    motivations: motivationKeys.map((key) => {
      const selected = character.profile.motivations[key];
      const option = findMotivationOption(key, selected.optionId);
      return { label: motivationLabels[key], name: option?.name ?? "Not selected", detail: selected.detail, description: option?.description ?? "" };
    }),
    abilities: formattedArchetypeAbilities(archetype).map(({ name, rules }) => ({ name, rules })),
    skills: skills.map((skill) => ({
      name: skill.name,
      characteristic: skill.characteristic,
      rank: skillRank(character, skill.id),
      dice: (() => {
        const pool = skillPool(character, skill.id);
        return { proficiency: pool.proficiency, ability: pool.ability };
      })()
    })),
    talents: Object.entries(ranks).map(([id, rank]) => {
      const talent = find(talents, id);
      return { name: talent.name, rank, activation: talent.activation, rules: talent.rules };
    }).sort((left, right) => left.name.localeCompare(right.name)),
    specializations: character.build.specializationIds.map((id) => {
      const specialization = find(specializations, id);
      return {
        name: specialization.name,
        nodes: specialization.nodes.map((node) => ({
          id: node.id,
          name: find(talents, node.talentId).name,
          row: node.row,
          column: node.column,
          cost: node.cost,
          defining: Boolean(node.defining),
          purchased: purchasedNodeIds.has(node.id)
        })),
        edges: specialization.edges
      };
    }),
    equipment: character.inventory.map((instance) => {
      const item = find(items, instance.itemId);
      return {
        name: item.name,
        category: item.category,
        equipped: instance.equipped,
        stats: itemStats(item),
        description: item.description,
        attachments: (instance.attachmentIds ?? []).map((id) => {
          const attachment = find(attachments, id);
          return `${attachment.name}: ${attachment.effect}`;
        })
      };
    }),
    backstory: character.profile.backstory
  };
}
