import { describe, expect, it } from "vitest";
import { archetypes } from "./canonical";
import { formattedArchetypeAbilities } from "./archetypeFormatting";

describe("archetype presentation", () => {
  it("removes duplicated inline titles from a single ability", () => {
    const agile = archetypes.find((record) => record.id === "agile")!;
    const [ability] = formattedArchetypeAbilities(agile);
    expect(ability.name).toBe("Focused Potential - Agility");
    expect(ability.rules).toMatch(/^When you spend/);
  });

  it("separates compound archetypes into titled rules", () => {
    const ghost = archetypes.find((record) => record.id === "ghost")!;
    const abilities = formattedArchetypeAbilities(ghost);
    expect(abilities.map(({ name }) => name)).toEqual(["Erasure", "Tradecraft", "No Paper Trail", "Prepared Cover", "Disappear"]);
    expect(abilities.every(({ rules }) => rules.length > 0)).toBe(true);
  });
});
