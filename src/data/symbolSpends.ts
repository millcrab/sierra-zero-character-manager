export type NarrativeSymbol = "advantage" | "triumph" | "threat" | "despair";
export type EncounterKind = "combat" | "social";

export interface SymbolCost {
  symbol: NarrativeSymbol;
  count: number;
  alternative?: NarrativeSymbol;
}

export interface SymbolSpend {
  id: string;
  cost: SymbolCost;
  effect: string;
}

export interface SymbolSpendReference {
  scene: EncounterKind;
  title: string;
  source: string;
  positive: SymbolSpend[];
  negative: SymbolSpend[];
  reminders: string[];
}

const spend = (id: string, symbol: NarrativeSymbol, count: number, effect: string, alternative?: NarrativeSymbol): SymbolSpend => ({
  id,
  cost: { symbol, count, alternative },
  effect
});

export const symbolSpendReferences: Record<EncounterKind, SymbolSpendReference> = {
  combat: {
    scene: "combat",
    title: "Combat symbol spends",
    source: "CRB 22–24, 102–104",
    positive: [
      spend("combat-recover-strain", "advantage", 1, "Recover 1 strain.", "triumph"),
      spend("combat-help-next-ally", "advantage", 1, "Add a Boost die to the next allied character's check.", "triumph"),
      spend("combat-notice-detail", "advantage", 1, "Notice an important detail in the conflict, such as a control panel, escape route, or structural weakness.", "triumph"),
      spend("combat-critical", "advantage", 1, "On a damaging hit, trigger the weapon's Critical rating. The listed rating determines the actual Advantage cost.", "triumph"),
      spend("combat-quality", "advantage", 1, "Activate an active item quality. The quality's rating determines the actual Advantage cost.", "triumph"),
      spend("combat-free-maneuver", "advantage", 2, "Immediately perform a free maneuver, while still respecting the limit of two maneuvers per turn.", "triumph"),
      spend("combat-hinder-target", "advantage", 2, "Add a Setback die to the target's next check.", "triumph"),
      spend("combat-help-any-ally", "advantage", 2, "Add a Boost die to any allied character's next check, including your own.", "triumph"),
      spend("combat-negate-defense", "advantage", 3, "Negate the target's defense until the end of the current round.", "triumph"),
      spend("combat-ignore-environment", "advantage", 3, "Ignore a penalizing environmental effect until the end of your next turn.", "triumph"),
      spend("combat-disable", "advantage", 3, "Instead of wounds or strain, temporarily disable the target or one piece of their gear; agree on a proportionate effect with the GM.", "triumph"),
      spend("combat-defense", "advantage", 3, "Gain +1 melee or ranged defense until the end of your next turn.", "triumph"),
      spend("combat-disarm", "advantage", 3, "Force the target to drop a weapon they are wielding.", "triumph"),
      spend("combat-triumph-as-advantage", "triumph", 1, "Activate any effect above that is costed in Advantage."),
      spend("combat-upgrade-enemy", "triumph", 1, "Upgrade the difficulty of the target's next check."),
      spend("combat-upgrade-ally", "triumph", 1, "Upgrade the ability of any allied character's next check, including your own."),
      spend("combat-vital-action", "triumph", 1, "Accomplish something vital in the scene, such as sealing a blast door or disabling a crucial control."),
      spend("combat-initiative-maneuver", "triumph", 1, "On an Initiative check, perform an immediate free maneuver before combat begins."),
      spend("combat-destroy-equipment", "triumph", 2, "On a damaging hit, destroy a significant piece of equipment the target is using.")
    ],
    negative: [
      spend("combat-suffer-strain", "threat", 1, "The active character suffers 1 strain.", "despair"),
      spend("combat-lose-maneuver-benefit", "threat", 1, "Lose the benefit of a prior maneuver, such as cover or guarded stance, until it is performed again.", "despair"),
      spend("combat-enemy-maneuver", "threat", 2, "An opponent immediately performs one free maneuver as an incidental.", "despair"),
      spend("combat-help-target", "threat", 2, "Add a Boost die to the target's next check.", "despair"),
      spend("combat-hinder-ally", "threat", 2, "Add a Setback die to the active character's or an ally's next action.", "despair"),
      spend("combat-prone", "threat", 3, "The active character falls prone.", "despair"),
      spend("combat-enemy-advantage", "threat", 3, "Give the enemy a significant situational advantage that follows from the action.", "despair"),
      spend("combat-despair-as-threat", "despair", 1, "Activate any effect above that is costed in Threat."),
      spend("combat-ammo", "despair", 1, "The active weapon runs out of ammunition and cannot be used for the rest of the encounter."),
      spend("combat-upgrade-ally-difficulty", "despair", 1, "Upgrade the difficulty of the active character's or an ally's next check."),
      spend("combat-damage-tool", "despair", 1, "Damage the tool, Brawl weapon, or Melee weapon used for the check.")
    ],
    reminders: [
      "Triumph also contributes one Success; Despair also contributes one Failure. Their special effects do not cancel each other.",
      "A single roll may fund several different effects; specific qualities and abilities state when their effect can be triggered repeatedly.",
      "Weapon descriptions, item qualities, talents, and Critical ratings can add or change spend options.",
      "The lists are examples, not limits. A player or GM may propose another effect that fits the roll, its cost, and the scene."
    ]
  },
  social: {
    scene: "social",
    title: "Social symbol spends",
    source: "CRB 22–24, 118–122",
    positive: [
      spend("social-recover-strain", "advantage", 1, "Recover 1 strain.", "triumph"),
      spend("social-help-next-ally", "advantage", 1, "Add a Boost die to the next allied active character's check.", "triumph"),
      spend("social-notice-detail", "advantage", 1, "Notice an important detail in the encounter, such as an interested observer, a private exit, or a useful distraction.", "triumph"),
      spend("social-learn-strength-flaw", "advantage", 2, "Learn the target's Strength or Flaw.", "triumph"),
      spend("social-hinder-target", "advantage", 2, "Add a Setback die to the target's next check.", "triumph"),
      spend("social-help-any-ally", "advantage", 2, "Add a Boost die to any allied character's next check, including your own.", "triumph"),
      spend("social-learn-desire-fear", "advantage", 3, "Learn the target's Desire or Fear.", "triumph"),
      spend("social-conceal-goal", "advantage", 3, "Successfully conceal your true goal in the encounter.", "triumph"),
      spend("social-learn-goal", "advantage", 3, "Learn the target's true goal, if they have one.", "triumph"),
      spend("social-triumph-as-advantage", "triumph", 1, "Activate any effect above that is costed in Advantage."),
      spend("social-learn-motivation", "triumph", 1, "With GM approval, learn any one Motivation facet of a character in the encounter."),
      spend("social-upgrade-target", "triumph", 1, "Upgrade the difficulty of the target's next check."),
      spend("social-upgrade-ally", "triumph", 1, "Upgrade the ability of any allied character's next check, including your own."),
      spend("social-vital-action", "triumph", 1, "Accomplish something vital, such as commanding everyone's attention or creating an opening for allies.")
    ],
    negative: [
      spend("social-suffer-strain", "threat", 1, "The active character suffers 1 strain.", "despair"),
      spend("social-distracted", "threat", 1, "Become briefly distracted or sidetracked, potentially losing access to a maneuver-based ability next turn.", "despair"),
      spend("social-reveal-strength-flaw", "threat", 2, "Accidentally reveal your own Strength or Flaw.", "despair"),
      spend("social-help-target", "threat", 2, "Add a Boost die to the target's next check.", "despair"),
      spend("social-hinder-ally", "threat", 2, "Add a Setback die to the active character's or an ally's next action.", "despair"),
      spend("social-reveal-desire-fear", "threat", 3, "Accidentally reveal your own Desire or Fear.", "despair"),
      spend("social-reveal-goal", "threat", 3, "Accidentally reveal your true goal in the encounter.", "despair"),
      spend("social-despair-as-threat", "despair", 1, "Activate any effect above that is costed in Threat."),
      spend("social-reveal-ally", "despair", 1, "Accidentally reveal one Motivation facet belonging to an ally."),
      spend("social-false-read", "despair", 1, "Receive a false read of one target Motivation facet and believe it is true."),
      spend("social-upgrade-ally-difficulty", "despair", 1, "Upgrade the difficulty of the active character's or an ally's next check."),
      spend("social-lose-round", "despair", 1, "Become so embroiled in irrelevant events that you cannot do anything important during the next round.")
    ],
    reminders: [
      "A Motivation learned through symbols becomes a usable social clue; it does not force the target to act against their nature.",
      "Triumph also contributes one Success; Despair also contributes one Failure. Their special effects do not cancel each other.",
      "A single roll may fund several different effects; specific abilities state when their effect can be triggered repeatedly.",
      "These are examples, not limits. Tailor other effects to the conversation, leverage gained, and consequences already established in the scene."
    ]
  }
};
