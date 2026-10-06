import { describe, expect, it } from "vitest";
import { archetypes, attachments, careers, items, skills, specializations, talents } from "./canonical";
import { validateSpecialization } from "../engine/validation";

describe("canonical source import", () => {
  it("contains every expected source record", () => {
    expect(skills).toHaveLength(32);
    expect(talents).toHaveLength(257);
    expect(archetypes).toHaveLength(24);
    expect(careers).toHaveLength(6);
    expect(specializations).toHaveLength(39);
    expect(specializations.flatMap((record) => record.nodes)).toHaveLength(780);
    expect(specializations.flatMap((record) => record.edges)).toHaveLength(726);
    expect(items).toHaveLength(125);
    expect(attachments).toHaveLength(31);
  });

  it("validates all specialization trees and references", () => {
    const skillIds = new Set(skills.map((record) => record.id));
    const talentIds = new Set(talents.map((record) => record.id));
    const specializationIds = new Set(specializations.map((record) => record.id));
    const itemIds = new Set(items.map((record) => record.id));

    for (const career of careers) {
      expect(career.careerSkillIds.every((id) => skillIds.has(id))).toBe(true);
      expect(career.specializationIds.every((id) => specializationIds.has(id))).toBe(true);
    }
    for (const specialization of specializations) {
      expect(validateSpecialization(specialization)).toEqual([]);
      expect(specialization.bonusCareerSkillIds.every((id) => skillIds.has(id))).toBe(true);
      expect(specialization.nodes.every((node) => talentIds.has(node.talentId))).toBe(true);
    }
    for (const archetype of archetypes) {
      expect(archetype.startingSkillChoiceIds.every((id) => skillIds.has(id))).toBe(true);
      expect((archetype.startingSkillGroups ?? []).flatMap((group) => group.eligibleSkillIds).every((id) => skillIds.has(id))).toBe(true);
      expect((archetype.startingSkillGroups ?? []).flatMap((group) => group.options ?? []).every((option) =>
        skillIds.has(option.skillId) && (option.careerSkillIds ?? []).every((id) => skillIds.has(id))
      )).toBe(true);
    }
    for (const attachment of attachments) {
      expect(attachment.eligibleItemIds.every((id) => itemIds.has(id))).toBe(true);
      expect(attachment.hardPoints).toBeGreaterThanOrEqual(0);
    }
  });
});
