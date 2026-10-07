import { describe, expect, it } from "vitest";
import { skills } from "./canonical";
import { gameplayCategories, gameplayRules, qualityGuides, skillGuides } from "./gameplay";

const unique = (values: string[]) => new Set(values).size === values.length;

describe("gameplay manual data", () => {
  it("provides a unique, sourced rule index across every gameplay category", () => {
    expect(unique(gameplayRules.map((rule) => rule.id))).toBe(true);
    expect(gameplayRules).toHaveLength(33);
    for (const category of gameplayCategories) {
      expect(gameplayRules.some((rule) => rule.category === category)).toBe(true);
    }
    for (const rule of gameplayRules) {
      expect(rule.source).toMatch(/CRB/);
      expect(rule.sections.length).toBeGreaterThan(0);
    }
  });

  it("provides guidance for every Sierra Zero skill", () => {
    expect(unique(skillGuides.map((guide) => guide.skillId))).toBe(true);
    expect(new Set(skillGuides.map((guide) => guide.skillId))).toEqual(new Set(skills.map((skill) => skill.id)));
    for (const guide of skillGuides) {
      expect(guide.commonUses.length).toBeGreaterThanOrEqual(3);
      expect(guide.source.length).toBeGreaterThan(0);
    }
  });

  it("provides a unique, concise personal-scale quality index", () => {
    expect(unique(qualityGuides.map((quality) => quality.id))).toBe(true);
    expect(unique(qualityGuides.map((quality) => quality.name))).toBe(true);
    expect(qualityGuides.length).toBeGreaterThanOrEqual(25);
    expect(qualityGuides.some((quality) => quality.name === "Auto-Fire" && quality.kind === "active")).toBe(true);
    expect(qualityGuides.some((quality) => quality.name === "Pierce" && quality.kind === "passive")).toBe(true);
    expect(qualityGuides.some((quality) => quality.name === "Tractor")).toBe(false);
    expect(qualityGuides.some((quality) => quality.name === "Personal Scale")).toBe(false);
  });
});
