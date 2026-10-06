import { describe, expect, it } from "vitest";
import { specialForces } from "../data/canonical";
import {
  applySessionUpdate,
  applyStartingSkillSelections,
  availableXp,
  canAcquireNormally,
  canInstallAttachment,
  canPurchaseNode,
  careerSkillIds,
  canIncreaseCharacteristic,
  createCharacterDraft,
  decreaseCharacteristic,
  decreaseSkill,
  defenses,
  createAgileOperatorDraft,
  favorCost,
  increaseCharacteristic,
  increaseSkill,
  itemFavorCost,
  remainingHardPoints,
  removeNodeWithCascade,
  removeAttachmentFromDraft,
  removeInventoryFromDraft,
  newEncounter,
  nextTurn,
  setExtraManeuver,
  setItemEquipped,
  skillPool,
  skillRank,
  skillXpSpent,
  specializationAcquisitionCost,
  thresholds
} from "./rules";
import { attachments, items } from "../data/canonical";
import { validateSpecialization } from "./validation";

describe("vertical-slice canonical data", () => {
  it("validates the Special Forces tree", () => {
    expect(validateSpecialization(specialForces)).toEqual([]);
  });

  it("applies multi-part archetype construction choices", () => {
    const ghost = createCharacterDraft("ghost", "operator", "special-forces");
    applyStartingSkillSelections(ghost, {
      archetypeSkillIds: [],
      archetypeSkillGroups: { erasure: ["institutional-knowledge"], tradecraft: ["physical-stealth"] },
      careerSkillIds: ["athletics", "brawl", "cool", "vigilance"],
      specializationSkillIds: ["athletics", "leadership"]
    });
    expect(ghost.build.grantedSkillRanks).toMatchObject({ knowledge: 1, stealth: 2 });
    expect(careerSkillIds(ghost).has("knowledge")).toBe(true);
    expect(careerSkillIds(ghost).has("stealth")).toBe(true);

    const scion = createCharacterDraft("scion", "operator", "special-forces");
    applyStartingSkillSelections(scion, {
      archetypeSkillIds: [],
      archetypeSkillGroups: { inheritance: ["public-office-knowledge"], claim: ["affection"] },
      careerSkillIds: ["athletics", "brawl", "cool", "vigilance"],
      specializationSkillIds: ["athletics", "leadership"]
    });
    expect(scion.build.grantedSkillRanks).toMatchObject({ knowledge: 1, charm: 1 });
    expect(careerSkillIds(scion).has("negotiation")).toBe(true);
  });

  it("builds the Agile baseline", () => {
    const character = createAgileOperatorDraft();
    applyStartingSkillSelections(character, {
      archetypeSkillIds: [],
      archetypeSkillGroups: { choice: ["coordination"] },
      careerSkillIds: ["athletics", "brawl", "cool", "vigilance"],
      specializationSkillIds: ["athletics", "stealth"]
    });
    expect(thresholds(character)).toEqual({ wounds: 12, strain: 11, soak: 2 });
    expect(availableXp(character)).toBe(110);
    expect(skillPool(character, "coordination")).toMatchObject({ proficiency: 1, ability: 2 });
    expect(skillPool(character, "athletics")).toMatchObject({ proficiency: 2, ability: 0 });
    expect(character.resources.money).toBe(500);
  });
});

describe("advancement accounting", () => {
  it("uses career and non-career skill costs and preserves granted ranks", () => {
    const character = createAgileOperatorDraft();
    applyStartingSkillSelections(character, {
      archetypeSkillIds: [],
      archetypeSkillGroups: { choice: ["coordination"] },
      careerSkillIds: ["brawl", "cool", "driving", "vigilance"],
      specializationSkillIds: ["stealth", "leadership"]
    });
    character.build.purchases.skillRanks.athletics = 2;
    character.build.purchases.skillRanks.coordination = 1;
    expect(skillXpSpent(character)).toBe(15 + 15);
    expect(availableXp(character)).toBe(80);
  });

  it("aggregates ranked threshold talents", () => {
    const character = createAgileOperatorDraft();
    character.build.purchases.talentNodeIds = ["sf-1-1", "sf-1-2", "sf-2-1", "sf-3-1", "sf-3-4"];
    expect(thresholds(character)).toEqual({ wounds: 16, strain: 12, soak: 2 });
  });

  it("round-trips purchased skill ranks without selling granted ranks", () => {
    const character = createAgileOperatorDraft();
    applyStartingSkillSelections(character, {
      archetypeSkillIds: [], archetypeSkillGroups: { choice: ["coordination"] },
      careerSkillIds: ["brawl", "cool", "driving", "vigilance"],
      specializationSkillIds: ["athletics", "leadership"]
    });
    const before = availableXp(character);
    increaseSkill(character, "brawl", true);
    expect(skillRank(character, "brawl")).toBe(2);
    expect(availableXp(character)).toBe(before - 10);
    decreaseSkill(character, "brawl");
    expect(skillRank(character, "brawl")).toBe(1);
    expect(availableXp(character)).toBe(before);
    decreaseSkill(character, "brawl");
    expect(skillRank(character, "brawl")).toBe(1);
  });

  it("round-trips creation-only characteristic increases", () => {
    const character = createAgileOperatorDraft();
    const before = availableXp(character);
    expect(canIncreaseCharacteristic(character, "brawn")).toBe(true);
    increaseCharacteristic(character, "brawn");
    expect(character.build.purchases.characteristicRanks.brawn).toBe(1);
    expect(availableXp(character)).toBe(before - 30);
    decreaseCharacteristic(character, "brawn");
    expect(availableXp(character)).toBe(before);
  });

  it("rounds the Favor price component up", () => {
    expect(favorCost(1, 2, 0)).toBe(3);
    expect(favorCost(1500, 5, 2)).toBe(10);
  });

  it("uses escalating specialization costs and treats universal trees as in-career", () => {
    expect(specializationAcquisitionCost(1, true)).toBe(20);
    expect(specializationAcquisitionCost(1, false)).toBe(30);
    expect(specializationAcquisitionCost(2, true)).toBe(30);
  });

  it("applies only the final session changes, clamps Favor, and resets session uses", () => {
    const character = createAgileOperatorDraft();
    character.usage.sessionTalentIds = ["natural-marksman"];
    applySessionUpdate(character, 15, 95);
    expect(character.resources.xpAwarded).toBe(15);
    expect(character.resources.favor).toBe(100);
    expect(character.usage.sessionTalentIds).toEqual([]);
  });

  it("maps controlled gear to +0, blocks advanced purchases, and tracks attachment hard points", () => {
    const character = createAgileOperatorDraft();
    character.inventory.push({ instanceId: "pistol-1", itemId: "pistol", equipped: false, attachmentIds: [] });
    expect(itemFavorCost(items.find((item) => item.id === "pistol")!)).toBe(3);
    expect(itemFavorCost(attachments.find((item) => item.id === "hair-trigger")!)).toBe(4);
    expect(canAcquireNormally("controlled")).toBe(true);
    expect(canAcquireNormally("advanced")).toBe(false);
    expect(canInstallAttachment(character, "pistol-1", "hair-trigger")).toBe(true);
    character.inventory[0].attachmentIds.push("hair-trigger");
    expect(remainingHardPoints(character, "pistol-1")).toBe(1);
    expect(canInstallAttachment(character, "pistol-1", "hair-trigger")).toBe(false);
  });

  it("applies equipped armor and limits equipped weapons to three", () => {
    const character = createAgileOperatorDraft();
    character.inventory.push({ instanceId: "armor", itemId: "sports-pads", equipped: false, attachmentIds: [] });
    setItemEquipped(character, "armor", true);
    expect(defenses(character)).toEqual({ melee: 1, ranged: 1 });
    for (let index = 0; index < 4; index += 1) character.inventory.push({ instanceId: `weapon-${index}`, itemId: "pistol", equipped: false, attachmentIds: [] });
    for (let index = 0; index < 4; index += 1) setItemEquipped(character, `weapon-${index}`, true);
    expect(character.inventory.filter((instance) => instance.equipped && instance.itemId === "pistol")).toHaveLength(3);
  });

  it("refunds draft gear and attachment payments but not rewards", () => {
    const character = createAgileOperatorDraft();
    character.resources.money = 100;
    character.resources.favor = 5;
    character.inventory.push({
      instanceId: "paid-item", itemId: "pistol", equipped: false,
      attachmentIds: ["hair-trigger"],
      acquisition: { payment: "cash", amount: 50 },
      attachmentAcquisitions: { "hair-trigger": { payment: "favor", amount: 4 } }
    });
    removeAttachmentFromDraft(character, "paid-item", "hair-trigger");
    expect(character.resources.favor).toBe(9);
    expect(character.inventory[0].attachmentIds).toEqual([]);
    removeInventoryFromDraft(character, "paid-item");
    expect(character.resources.money).toBe(150);
    expect(character.inventory).toEqual([]);
    character.inventory.push({ instanceId: "reward", itemId: "pistol", equipped: false, attachmentIds: [], acquisition: { payment: "reward", amount: 0 } });
    removeInventoryFromDraft(character, "reward");
    expect(character.resources.money).toBe(150);
  });

  it("resets encounter uses and commits extra-maneuver strain on next turn", () => {
    const character = createAgileOperatorDraft();
    character.usage.encounterTalentIds = ["dodge"];
    setExtraManeuver(character, true);
    expect(character.resources.strain).toBe(2);
    setExtraManeuver(character, false);
    expect(character.resources.strain).toBe(0);
    setExtraManeuver(character, true);
    nextTurn(character);
    expect(character.resources.strain).toBe(2);
    expect(character.usage.turnChecklist.extraManeuver).toBe(false);
    newEncounter(character);
    expect(character.usage.encounterTalentIds).toEqual([]);
  });
});

describe("specialization graph", () => {
  it("allows entry nodes and connected nodes only", () => {
    expect(canPurchaseNode(specialForces, [], "sf-1-1")).toBe(true);
    expect(canPurchaseNode(specialForces, [], "sf-2-1")).toBe(false);
    expect(canPurchaseNode(specialForces, ["sf-1-1"], "sf-2-1")).toBe(true);
    expect(canPurchaseNode(specialForces, ["sf-2-1"], "sf-1-1")).toBe(true);
  });

  it("removes a disconnected downstream branch and refunds exact node costs", () => {
    const result = removeNodeWithCascade(
      specialForces,
      ["sf-1-1", "sf-2-1", "sf-3-1", "sf-4-1", "sf-5-1"],
      "sf-2-1"
    );
    expect([...result.remaining]).toEqual(["sf-1-1"]);
    expect(result.refund).toBe(70);
  });

  it("preserves downstream nodes when an alternate purchased path remains", () => {
    const result = removeNodeWithCascade(
      specialForces,
      ["sf-1-1", "sf-2-1", "sf-1-2", "sf-2-2", "sf-3-2"],
      "sf-2-1"
    );
    expect(result.remaining).toEqual(new Set(["sf-1-1", "sf-1-2", "sf-2-2", "sf-3-2"]));
    expect(result.refund).toBe(10);
  });
});
