import { describe, expect, it } from "vitest";
import { createCharacterDraft } from "../engine/rules";
import { createCharacterSheetModel } from "./characterSheetModel";

describe("character sheet model", () => {
  it("collects shareable character details without mutating the character", () => {
    const character = createCharacterDraft();
    character.profile.name = "Morgan Vale";
    character.profile.backstory = "Responder and field analyst.";
    character.resources.money = 425;
    const before = structuredClone(character);
    const sheet = createCharacterSheetModel(character);
    expect(sheet.name).toBe("Morgan Vale");
    expect(sheet.status).toContainEqual({ label: "Money", value: "$425" });
    expect(sheet.skills.length).toBeGreaterThan(20);
    expect(sheet.skills.find((skill) => skill.name === "Coordination")?.dice).toEqual({ proficiency: 0, ability: 3 });
    expect(sheet.specializations[0].nodes).toHaveLength(20);
    expect(sheet.abilities[0].rules).not.toMatch(/^Focused Potential/);
    expect(character).toEqual(before);
  });

  it("records structured and free-text archetype ability choices", () => {
    const character = createCharacterDraft("scion");
    character.profile.archetypeAbilityChoices["inheritance-network"] = "The Vale Foundation";
    character.build.startingSkillSelections.archetypeSkillGroups = {
      inheritance: ["commerce-knowledge"],
      claim: ["authority"]
    };
    expect(createCharacterSheetModel(character).archetypeChoices).toEqual([
      { label: "Actual inheritance network", value: "The Vale Foundation" },
      { label: "Inheritance network and ranked skill", value: "Commerce - Knowledge" },
      { label: "Claim", value: "Authority - Leadership" }
    ]);
  });
});
