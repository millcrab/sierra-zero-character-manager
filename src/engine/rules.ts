import { archetypes, attachments, careers, items, skills, specializations, talents } from "../data/canonical";
import type {
  ArchetypeRecord,
  AttachmentRecord,
  AcquisitionRecord,
  Character,
  CharacteristicKey,
  Characteristics,
  DicePool,
  ItemRecord,
  SpecializationRecord
} from "../types";

const byId = <T extends { id: string }>(records: T[], id: string): T => {
  const record = records.find((candidate) => candidate.id === id);
  if (!record) throw new Error(`Unknown canonical id: ${id}`);
  return record;
};

export const getArchetype = (id: string) => byId(archetypes, id);
export const getCareer = (id: string) => byId(careers, id);
export const getSpecialization = (id: string) => byId(specializations, id);

export function derivedCharacteristics(character: Character): Characteristics {
  const archetype = getArchetype(character.build.archetypeId);
  const result = { ...archetype.baseCharacteristics };
  for (const [key, increases] of Object.entries(character.build.purchases.characteristicRanks)) {
    result[key as CharacteristicKey] += increases ?? 0;
  }
  return result;
}

export function careerSkillIds(character: Character): Set<string> {
  const ids = new Set(getCareer(character.build.careerId).careerSkillIds);
  const archetype = getArchetype(character.build.archetypeId);
  for (const group of archetype.startingSkillGroups ?? []) {
    if (!group.grantsCareerSkill) continue;
    for (const selectedId of character.build.startingSkillSelections.archetypeSkillGroups?.[group.id] ?? []) {
      const option = group.options?.find((candidate) => candidate.id === selectedId);
      for (const skillId of option?.careerSkillIds ?? [option?.skillId ?? selectedId]) ids.add(skillId);
    }
  }
  for (const specializationId of character.build.specializationIds) {
    for (const skillId of getSpecialization(specializationId).bonusCareerSkillIds) ids.add(skillId);
  }
  return ids;
}

export function skillRank(character: Character, skillId: string): number {
  return (character.build.grantedSkillRanks[skillId] ?? 0) +
    (character.build.purchases.skillRanks[skillId] ?? 0);
}

export function skillPool(character: Character, skillId: string): DicePool {
  const skill = byId(skills, skillId);
  const characteristic = derivedCharacteristics(character)[skill.characteristic];
  const rank = skillRank(character, skillId);
  return {
    proficiency: Math.min(characteristic, rank),
    ability: Math.abs(characteristic - rank),
    boosts: 0,
    setbacks: 0,
    reminders: []
  };
}

export function characteristicXpSpent(character: Character): number {
  const base = getArchetype(character.build.archetypeId).baseCharacteristics;
  return Object.entries(character.build.purchases.characteristicRanks).reduce((sum, [key, increases]) => {
    let cost = 0;
    for (let i = 1; i <= (increases ?? 0); i += 1) {
      cost += (base[key as CharacteristicKey] + i) * 10;
    }
    return sum + cost;
  }, 0);
}

export function skillXpSpent(character: Character): number {
  const career = careerSkillIds(character);
  return Object.entries(character.build.purchases.skillRanks).reduce((sum, [skillId, purchased]) => {
    const granted = character.build.grantedSkillRanks[skillId] ?? 0;
    let cost = 0;
    for (let i = 1; i <= purchased; i += 1) {
      const newRank = granted + i;
      cost += newRank * 5 + (career.has(skillId) ? 0 : 5);
    }
    return sum + cost;
  }, 0);
}

export function nextSkillRankCost(character: Character, skillId: string): number {
  const newRank = skillRank(character, skillId) + 1;
  return newRank * 5 + (careerSkillIds(character).has(skillId) ? 0 : 5);
}

export function canIncreaseSkill(character: Character, skillId: string, creation = false): boolean {
  const cap = creation ? 2 : 5;
  return skillRank(character, skillId) < cap && availableXp(character) >= nextSkillRankCost(character, skillId);
}

export function increaseSkill(character: Character, skillId: string, creation = false): Character {
  if (!canIncreaseSkill(character, skillId, creation)) return character;
  character.build.purchases.skillRanks[skillId] = (character.build.purchases.skillRanks[skillId] ?? 0) + 1;
  return character;
}

export function decreaseSkill(character: Character, skillId: string): Character {
  const purchased = character.build.purchases.skillRanks[skillId] ?? 0;
  if (purchased <= 0) return character;
  if (purchased === 1) delete character.build.purchases.skillRanks[skillId];
  else character.build.purchases.skillRanks[skillId] = purchased - 1;
  return character;
}

export function nextCharacteristicCost(character: Character, key: CharacteristicKey): number {
  return (derivedCharacteristics(character)[key] + 1) * 10;
}

export function canIncreaseCharacteristic(character: Character, key: CharacteristicKey): boolean {
  return character.status === "draft" && derivedCharacteristics(character)[key] < 5 && availableXp(character) >= nextCharacteristicCost(character, key);
}

export function increaseCharacteristic(character: Character, key: CharacteristicKey): Character {
  if (!canIncreaseCharacteristic(character, key)) return character;
  character.build.purchases.characteristicRanks[key] = (character.build.purchases.characteristicRanks[key] ?? 0) + 1;
  return character;
}

export function decreaseCharacteristic(character: Character, key: CharacteristicKey): Character {
  if (character.status !== "draft") return character;
  const purchased = character.build.purchases.characteristicRanks[key] ?? 0;
  if (purchased <= 0) return character;
  if (purchased === 1) delete character.build.purchases.characteristicRanks[key];
  else character.build.purchases.characteristicRanks[key] = purchased - 1;
  return character;
}

export function talentXpSpent(character: Character): number {
  const purchased = new Set(character.build.purchases.talentNodeIds);
  return character.build.specializationIds.reduce((sum, specializationId) => {
    const specialization = getSpecialization(specializationId);
    return sum + specialization.nodes
      .filter((node) => purchased.has(node.id))
      .reduce((nodeSum, node) => nodeSum + node.cost, 0);
  }, 0);
}

export function specializationAcquisitionCost(
  ownedSpecializationCount: number,
  isCareerOrUniversal: boolean
): number {
  const newTotal = ownedSpecializationCount + 1;
  return newTotal * 10 + (isCareerOrUniversal ? 0 : 10);
}

export function specializationXpSpent(character: Character): number {
  let ownedCount = 1;
  let total = 0;
  for (const specializationId of character.build.purchases.specializationIds) {
    const specialization = getSpecialization(specializationId);
    const isCareerOrUniversal = specialization.careerId === null || specialization.careerId === character.build.careerId;
    total += specializationAcquisitionCost(ownedCount, isCareerOrUniversal);
    ownedCount += 1;
  }
  return total;
}

export function availableXp(character: Character): number {
  const archetype = getArchetype(character.build.archetypeId);
  const total = archetype.startingXp + character.resources.bonusStartingXp + character.resources.xpAwarded;
  return total - characteristicXpSpent(character) - skillXpSpent(character) - talentXpSpent(character) - specializationXpSpent(character);
}

export function talentRanks(character: Character): Record<string, number> {
  const purchased = new Set(character.build.purchases.talentNodeIds);
  const ranks: Record<string, number> = {};
  for (const specializationId of character.build.specializationIds) {
    for (const node of getSpecialization(specializationId).nodes) {
      if (purchased.has(node.id)) ranks[node.talentId] = (ranks[node.talentId] ?? 0) + 1;
    }
  }
  return ranks;
}

export function thresholds(character: Character): { wounds: number; strain: number; soak: number } {
  const archetype = getArchetype(character.build.archetypeId);
  const characteristics = derivedCharacteristics(character);
  const ranks = talentRanks(character);
  let wounds = archetype.woundBase + characteristics.brawn;
  let strain = archetype.strainBase + characteristics.willpower;
  let soak = characteristics.brawn;
  for (const [talentId, rank] of Object.entries(ranks)) {
    const talent = byId(talents, talentId);
    for (const modifier of talent.modifiers ?? []) {
      if (modifier.kind === "woundThreshold") wounds += modifier.amountPerRank * rank;
      if (modifier.kind === "strainThreshold") strain += modifier.amountPerRank * rank;
      if (modifier.kind === "soak") soak += modifier.amountPerRank * rank;
    }
  }
  const equippedArmor = character.inventory
    .filter((instance) => instance.equipped)
    .map((instance) => items.find((item) => item.id === instance.itemId)?.armor)
    .filter((armor): armor is NonNullable<typeof armor> => Boolean(armor));
  soak += Math.max(0, ...equippedArmor.map((armor) => armor.soak));
  return { wounds, strain, soak };
}

export function defenses(character: Character): { melee: number; ranged: number } {
  const equippedArmor = character.inventory
    .filter((instance) => instance.equipped)
    .map((instance) => items.find((item) => item.id === instance.itemId)?.armor?.defense ?? 0);
  const defense = Math.max(0, ...equippedArmor);
  return { melee: defense, ranged: defense };
}

export function setItemEquipped(character: Character, instanceId: string, equipped: boolean): Character {
  const target = character.inventory.find((instance) => instance.instanceId === instanceId);
  if (!target) return character;
  const item = byId(items, target.itemId);
  if (equipped && item.category === "armor") {
    for (const instance of character.inventory) {
      if (byId(items, instance.itemId).category === "armor") instance.equipped = false;
    }
  }
  if (equipped && item.category === "weapon") {
    const equippedWeapons = character.inventory.filter((instance) => instance.equipped && byId(items, instance.itemId).category === "weapon");
    if (equippedWeapons.length >= 3) return character;
  }
  target.equipped = equipped;
  return character;
}

export function applyWounds(character: Character, change: number): Character {
  character.resources.wounds = Math.max(0, character.resources.wounds + Math.trunc(change));
  return character;
}

export function applyStrain(character: Character, change: number): Character {
  character.resources.strain = Math.max(0, character.resources.strain + Math.trunc(change));
  return character;
}

export function setExtraManeuver(character: Character, checked: boolean): Character {
  const wasChecked = character.usage.turnChecklist.extraManeuver;
  if (checked && !wasChecked) character.resources.strain += 2;
  if (!checked && wasChecked) character.resources.strain = Math.max(0, character.resources.strain - 2);
  character.usage.turnChecklist.extraManeuver = checked;
  return character;
}

export function nextTurn(character: Character): Character {
  character.usage.turnChecklist = { action: false, maneuver: false, extraManeuver: false };
  return character;
}

export function newEncounter(character: Character): Character {
  character.usage.encounterTalentIds = [];
  character.usage.turnChecklist = { action: false, maneuver: false, extraManeuver: false };
  return character;
}

function adjacency(specialization: SpecializationRecord): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  for (const node of specialization.nodes) graph.set(node.id, new Set());
  for (const [left, right] of specialization.edges) {
    graph.get(left)?.add(right);
    graph.get(right)?.add(left);
  }
  return graph;
}

export function canPurchaseNode(
  specialization: SpecializationRecord,
  purchasedIds: Iterable<string>,
  nodeId: string
): boolean {
  const purchased = new Set(purchasedIds);
  if (purchased.has(nodeId)) return false;
  if (specialization.entryNodeIds.includes(nodeId)) return true;
  const neighbors = adjacency(specialization).get(nodeId);
  return [...(neighbors ?? [])].some((neighbor) => purchased.has(neighbor));
}

export function reachablePurchasedNodes(
  specialization: SpecializationRecord,
  purchasedIds: Iterable<string>
): Set<string> {
  const purchased = new Set(purchasedIds);
  const graph = adjacency(specialization);
  const reachable = new Set<string>();
  const queue = specialization.entryNodeIds.filter((id) => purchased.has(id));
  for (const id of queue) reachable.add(id);
  while (queue.length) {
    const current = queue.shift()!;
    for (const neighbor of graph.get(current) ?? []) {
      if (purchased.has(neighbor) && !reachable.has(neighbor)) {
        reachable.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return reachable;
}

export function removeNodeWithCascade(
  specialization: SpecializationRecord,
  purchasedIds: Iterable<string>,
  nodeId: string
): { remaining: Set<string>; removed: Set<string>; refund: number } {
  const previous = new Set(purchasedIds);
  previous.delete(nodeId);
  const remaining = reachablePurchasedNodes(specialization, previous);
  const removed = new Set([...new Set(purchasedIds)].filter((id) => !remaining.has(id)));
  const refund = specialization.nodes
    .filter((node) => removed.has(node.id))
    .reduce((sum, node) => sum + node.cost, 0);
  return { remaining, removed, refund };
}

export function favorCost(price: number, rarity: number, accessModifier: 0 | 2 | 4): number {
  return rarity + Math.ceil(price / 500) + accessModifier;
}

export function accessModifier(access: ItemRecord["access"] | AttachmentRecord["access"]): 0 | 2 | 4 {
  if (access === "restricted") return 2;
  if (access === "illegal") return 4;
  return 0;
}

export function canAcquireNormally(access: ItemRecord["access"] | AttachmentRecord["access"]): boolean {
  return access !== "advanced";
}

export function itemFavorCost(item: ItemRecord | AttachmentRecord): number {
  return favorCost(item.price, item.rarity, accessModifier(item.access));
}

export function remainingHardPoints(character: Character, instanceId: string): number {
  const instance = character.inventory.find((candidate) => candidate.instanceId === instanceId);
  if (!instance) return 0;
  const item = byId(items, instance.itemId);
  const used = (instance.attachmentIds ?? []).reduce((sum, id) => sum + byId(attachments, id).hardPoints, 0);
  return item.hardPoints - used;
}

export function canInstallAttachment(character: Character, instanceId: string, attachmentId: string): boolean {
  const instance = character.inventory.find((candidate) => candidate.instanceId === instanceId);
  if (!instance || (instance.attachmentIds ?? []).includes(attachmentId)) return false;
  const attachment = byId(attachments, attachmentId);
  return attachment.eligibleItemIds.includes(instance.itemId) && remainingHardPoints(character, instanceId) >= attachment.hardPoints;
}

function refundAcquisition(character: Character, acquisition?: AcquisitionRecord): void {
  if (!acquisition || acquisition.payment === "reward") return;
  if (acquisition.payment === "cash") character.resources.money += acquisition.amount;
  if (acquisition.payment === "favor") character.resources.favor = Math.min(100, character.resources.favor + acquisition.amount);
}

export function removeAttachmentFromDraft(character: Character, instanceId: string, attachmentId: string): Character {
  if (character.status !== "draft") return character;
  const instance = character.inventory.find((candidate) => candidate.instanceId === instanceId);
  if (!instance || !instance.attachmentIds.includes(attachmentId)) return character;
  refundAcquisition(character, instance.attachmentAcquisitions?.[attachmentId]);
  instance.attachmentIds = instance.attachmentIds.filter((id) => id !== attachmentId);
  if (instance.attachmentAcquisitions) delete instance.attachmentAcquisitions[attachmentId];
  return character;
}

export function removeInventoryFromDraft(character: Character, instanceId: string): Character {
  if (character.status !== "draft") return character;
  const instance = character.inventory.find((candidate) => candidate.instanceId === instanceId);
  if (!instance) return character;
  refundAcquisition(character, instance.acquisition);
  for (const acquisition of Object.values(instance.attachmentAcquisitions ?? {})) refundAcquisition(character, acquisition);
  character.inventory = character.inventory.filter((candidate) => candidate.instanceId !== instanceId);
  return character;
}

export function applyStartingSkillSelections(
  character: Character,
  selections: Character["build"]["startingSkillSelections"]
): Character {
  const archetype = getArchetype(character.build.archetypeId);
  const career = getCareer(character.build.careerId);
  const startingSpecialization = getSpecialization(character.build.specializationIds[0]);
  const valid = (
    selected: string[],
    eligible: string[],
    limit: number
  ) => selected.length <= limit && new Set(selected).size === selected.length && selected.every((id) => eligible.includes(id));
  const groupedSelections = selections.archetypeSkillGroups ?? {};
  const startingCareerSkills = new Set([
    ...career.careerSkillIds,
    ...startingSpecialization.bonusCareerSkillIds
  ]);
  const groupsValid = (archetype.startingSkillGroups ?? []).every((group) => {
    const eligible = group.options?.map((option) => option.id) ?? group.eligibleSkillIds.filter((id) => !group.excludesCareerSkills || !startingCareerSkills.has(id));
    return valid(groupedSelections[group.id] ?? [], eligible, group.choiceCount);
  });
  const legacyArchetypeValid = archetype.startingSkillGroups?.length
    ? true
    : valid(selections.archetypeSkillIds, archetype.startingSkillChoiceIds, archetype.startingSkillChoiceCount);
  if (!groupsValid || !legacyArchetypeValid || !valid(selections.careerSkillIds, career.careerSkillIds, 4) ||
      !valid(selections.specializationSkillIds, startingSpecialization.bonusCareerSkillIds, 2)) {
    throw new Error("Illegal starting skill selection");
  }
  const ranks: Record<string, number> = {};
  for (const [skillId, rank] of Object.entries(archetype.fixedStartingSkillRanks ?? {})) ranks[skillId] = rank;
  for (const skillId of [
    ...selections.careerSkillIds,
    ...selections.specializationSkillIds
  ]) {
    ranks[skillId] = (ranks[skillId] ?? 0) + 1;
    if (ranks[skillId] > 2) throw new Error("Starting skill ranks cannot exceed 2");
  }
  if (archetype.startingSkillGroups?.length) {
    for (const group of archetype.startingSkillGroups) {
      for (const selectedId of groupedSelections[group.id] ?? []) {
        const skillId = group.options?.find((option) => option.id === selectedId)?.skillId ?? selectedId;
        ranks[skillId] = (ranks[skillId] ?? 0) + group.rank;
        if (ranks[skillId] > 2) throw new Error("Starting skill ranks cannot exceed 2");
      }
    }
  } else {
    for (const skillId of selections.archetypeSkillIds) {
      ranks[skillId] = (ranks[skillId] ?? 0) + (archetype.startingSkillChoiceRank ?? 1);
      if (ranks[skillId] > 2) throw new Error("Starting skill ranks cannot exceed 2");
    }
  }
  character.build.startingSkillSelections = selections;
  character.build.grantedSkillRanks = ranks;
  return character;
}

export function applySessionUpdate(character: Character, xpChange: number, favorChange: number): Character {
  character.resources.xpAwarded += Math.trunc(xpChange);
  character.resources.favor = Math.max(0, Math.min(100, character.resources.favor + Math.trunc(favorChange)));
  character.usage.sessionTalentIds = [];
  return character;
}

export function createCharacterDraft(
  archetypeId = "agile",
  careerId = "operator",
  specializationId = "special-forces"
): Character {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    status: "draft",
    profile: {
      name: "New Agent",
      portraitDataUrl: null,
      portraitFocusY: 50,
      backstory: "",
      motivations: {
        strength: { optionId: "", detail: "" },
        flaw: { optionId: "", detail: "" },
        desire: { optionId: "", detail: "" },
        fear: { optionId: "", detail: "" }
      }
    },
    build: {
      archetypeId,
      careerId,
      specializationIds: [specializationId],
      grantedSkillRanks: { ...(getArchetype(archetypeId).fixedStartingSkillRanks ?? {}) },
      startingSkillSelections: {
        archetypeSkillIds: [],
        archetypeSkillGroups: {},
        careerSkillIds: [],
        specializationSkillIds: []
      },
      purchases: {
        characteristicRanks: {},
        skillRanks: {},
        talentNodeIds: [],
        specializationIds: []
      }
    },
    resources: {
      startingBenefit: "favor",
      bonusStartingXp: 0,
      xpAwarded: 0,
      favor: 10,
      money: 500,
      wounds: 0,
      strain: 0
    },
    inventory: [],
    usage: {
      encounterTalentIds: [],
      sessionTalentIds: [],
      turnChecklist: { action: false, maneuver: false, extraManeuver: false }
    },
    metadata: { createdAt: now, updatedAt: now }
  };
}

export const createAgileOperatorDraft = () => createCharacterDraft();

export function archetypeThresholds(archetype: ArchetypeRecord): { wounds: number; strain: number } {
  return {
    wounds: archetype.woundBase + archetype.baseCharacteristics.brawn,
    strain: archetype.strainBase + archetype.baseCharacteristics.willpower
  };
}
