import { archetypes, skills } from "./canonical";
import type { Character } from "../types";

export interface ArchetypeChoiceField {
  id: string;
  abilityName: string;
  label: string;
  placeholder: string;
  required: boolean;
}

const fieldsByArchetype: Record<string, ArchetypeChoiceField[]> = {
  "black-sheep": [{
    id: "estranged-group",
    abilityName: "Old Ties",
    label: "Estranged family, community, or institution",
    placeholder: "Name the group connected to Old Ties",
    required: true
  }],
  scion: [{
    id: "inheritance-network",
    abilityName: "Inheritance",
    label: "Actual inheritance network",
    placeholder: "Name the office, company, institution, faith, or organization",
    required: true
  }]
};

const visibleGroupsByArchetype: Record<string, string[]> = {
  ghost: ["erasure", "tradecraft"],
  prodigy: ["choice"],
  scion: ["inheritance", "claim"]
};

export interface ArchetypeChoiceSummary {
  label: string;
  value: string;
}

export function archetypeChoiceFields(archetypeId: string): ArchetypeChoiceField[] {
  return fieldsByArchetype[archetypeId] ?? [];
}

export function archetypeChoiceFieldsComplete(character: Character): boolean {
  return archetypeChoiceFields(character.build.archetypeId).every((field) =>
    !field.required || Boolean(character.profile.archetypeAbilityChoices[field.id]?.trim())
  );
}

export function archetypeChoiceSummaries(character: Character): ArchetypeChoiceSummary[] {
  const archetype = archetypes.find((record) => record.id === character.build.archetypeId);
  if (!archetype) return [];
  const summaries: ArchetypeChoiceSummary[] = archetypeChoiceFields(archetype.id).map((field) => ({
    label: field.label,
    value: character.profile.archetypeAbilityChoices[field.id]?.trim() || "Not recorded"
  }));
  const visibleGroups = new Set(visibleGroupsByArchetype[archetype.id] ?? []);
  for (const group of archetype.startingSkillGroups ?? []) {
    if (!visibleGroups.has(group.id)) continue;
    const selectedIds = character.build.startingSkillSelections.archetypeSkillGroups?.[group.id] ?? [];
    const values = selectedIds.map((selectedId) => {
      const option = group.options?.find((record) => record.id === selectedId);
      if (option) return option.label;
      return skills.find((record) => record.id === selectedId)?.name ?? selectedId;
    });
    summaries.push({ label: group.label, value: values.join(", ") || "Not selected" });
  }
  return summaries;
}
