export type CharacteristicKey =
  | "brawn"
  | "agility"
  | "intellect"
  | "cunning"
  | "willpower"
  | "presence";

export type Characteristics = Record<CharacteristicKey, number>;

export type UsageLimit = "none" | "round" | "encounter" | "session";
export type Activation = "passive" | "active" | "incidental" | "maneuver" | "action";

export interface SkillRecord {
  id: string;
  name: string;
  characteristic: CharacteristicKey;
  category: "general" | "combat" | "social" | "knowledge";
}

export interface TalentModifier {
  kind: "woundThreshold" | "strainThreshold" | "soak";
  amountPerRank: number;
}

export interface TalentRecord {
  id: string;
  name: string;
  rules: string;
  ranked: boolean;
  activation: Activation;
  usage: UsageLimit;
  tags: string[];
  modifiers?: TalentModifier[];
}

export interface TalentNode {
  id: string;
  talentId: string;
  row: 1 | 2 | 3 | 4 | 5;
  column: 1 | 2 | 3 | 4;
  cost: 5 | 10 | 15 | 20 | 25;
  defining?: boolean;
}

export interface SpecializationRecord {
  id: string;
  name: string;
  careerId: string | null;
  description: string | null;
  bonusCareerSkillIds: string[];
  nodes: TalentNode[];
  edges: Array<readonly [string, string]>;
  entryNodeIds: string[];
}

export interface CareerRecord {
  id: string;
  name: string;
  description: string | null;
  careerSkillIds: string[];
  specializationIds: string[];
}

export interface ArchetypeAbility {
  id: string;
  name: string;
  rules: string;
  tags: string[];
}

export interface ArchetypeRecord {
  id: string;
  name: string;
  description: string;
  baseCharacteristics: Characteristics;
  startingXp: number;
  woundBase: number;
  strainBase: number;
  startingSkillChoiceIds: string[];
  startingSkillChoiceCount: number;
  startingSkillChoiceRank?: number;
  fixedStartingSkillRanks?: Record<string, number>;
  startingSkillInstructions?: string;
  startingSkillGroups?: Array<{
    id: string;
    label: string;
    eligibleSkillIds: string[];
    choiceCount: number;
    rank: number;
    grantsCareerSkill?: boolean;
    excludesCareerSkills?: boolean;
    options?: Array<{
      id: string;
      label: string;
      skillId: string;
      careerSkillIds?: string[];
    }>;
  }>;
  abilities: ArchetypeAbility[];
}

export interface WeaponProfile {
  skillId: string;
  damage: number | string;
  critical: number;
  range: string;
  qualities: string[];
}

export interface ArmorProfile {
  defense: number;
  soak: number;
}

export interface ItemRecord {
  id: string;
  name: string;
  category: "weapon" | "armor" | "gear";
  description: string;
  price: number;
  rarity: number;
  access: "ordinary" | "controlled" | "restricted" | "illegal" | "advanced";
  encumbrance: number;
  hardPoints: number;
  source?: string;
  weapon?: WeaponProfile;
  armor?: ArmorProfile;
}

export interface AttachmentRecord {
  id: string;
  name: string;
  description: string;
  price: number;
  rarity: number;
  access: "ordinary" | "controlled" | "restricted" | "illegal" | "advanced";
  hardPoints: number;
  eligibleItemIds: string[];
  useWith?: string;
  source?: string;
  effect: string;
}

export interface PurchaseLedger {
  characteristicRanks: Partial<Record<CharacteristicKey, number>>;
  skillRanks: Record<string, number>;
  talentNodeIds: string[];
  specializationIds: string[];
}

export type AcquisitionPayment = "cash" | "favor" | "reward";
export interface AcquisitionRecord {
  payment: AcquisitionPayment;
  amount: number;
}

export type MotivationKey = "strength" | "flaw" | "desire" | "fear";
export interface MotivationSelection {
  optionId: string;
  detail: string;
}

export interface Character {
  id: string;
  schemaVersion: 1;
  status: "draft" | "complete";
  profile: {
    name: string;
    portraitDataUrl: string | null;
    portraitFocusY?: number;
    backstory: string;
    motivations: {
      strength: MotivationSelection;
      flaw: MotivationSelection;
      desire: MotivationSelection;
      fear: MotivationSelection;
    };
  };
  build: {
    archetypeId: string;
    careerId: string;
    specializationIds: string[];
    grantedSkillRanks: Record<string, number>;
    startingSkillSelections: {
      archetypeSkillIds: string[];
      archetypeSkillGroups?: Record<string, string[]>;
      careerSkillIds: string[];
      specializationSkillIds: string[];
    };
    purchases: PurchaseLedger;
  };
  resources: {
    startingBenefit: "favor" | "xp";
    bonusStartingXp: number;
    xpAwarded: number;
    favor: number;
    money: number;
    wounds: number;
    strain: number;
  };
  inventory: Array<{
    instanceId: string;
    itemId: string;
    equipped: boolean;
    attachmentIds: string[];
    acquisition?: AcquisitionRecord;
    attachmentAcquisitions?: Record<string, AcquisitionRecord>;
  }>;
  usage: {
    encounterTalentIds: string[];
    sessionTalentIds: string[];
    turnChecklist: { action: boolean; maneuver: boolean; extraManeuver: boolean };
  };
  metadata: { createdAt: string; updatedAt: string };
}

export interface ManeuverRecord {
  id: string;
  name: string;
  summary: string;
  rules: string;
}

export interface DicePool {
  proficiency: number;
  ability: number;
  boosts: number;
  setbacks: number;
  reminders: string[];
}
