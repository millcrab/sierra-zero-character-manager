import type { MotivationKey } from "../types";

export interface MotivationOption {
  id: string;
  name: string;
  description: string;
}

export const motivationLabels: Record<MotivationKey, string> = {
  strength: "Strength",
  flaw: "Flaw",
  desire: "Desire",
  fear: "Fear"
};

export const motivationOptions: Record<MotivationKey, MotivationOption[]> = {
  strength: [
    { id: "adaptable", name: "Adaptable", description: "Flexible and resilient, this character rises to meet grim, unfamiliar, or rapidly changing circumstances." },
    { id: "analytical", name: "Analytical", description: "This character absorbs information, reasons carefully, and prefers conclusions that can withstand scrutiny." },
    { id: "courageous", name: "Courageous", description: "Danger rarely stops this character. Even when afraid, they are inclined to confront the threat rather than flee it." },
    { id: "curious", name: "Curious", description: "People, places, and unexplained truths pull this character forward; every mystery invites investigation." },
    { id: "idealistic", name: "Idealistic", description: "This character holds certain principles sacred and works to live up to them, even when others do not." },
    { id: "independent", name: "Independent", description: "This character trusts their own judgment and prepares to cope without depending on someone else to rescue them." },
    { id: "patient", name: "Patient", description: "Calm waiting helps this character avoid needless danger, but they act quickly when the right opportunity arrives." },
    { id: "spiritual", name: "Spiritual", description: "A deeply held faith or belief gives this character a stable foundation when circumstances become uncertain." },
    { id: "wise", name: "Wise", description: "Experience has taught this character how the world works—and when effort, insight, or compassion can change it." },
    { id: "witty", name: "Witty", description: "This character always seems to have the apt joke, sharp observation, or cutting reply ready." }
  ],
  flaw: [
    { id: "anger", name: "Anger", description: "This character lashes out too readily or with excessive force and may reach for confrontation before reflection." },
    { id: "compulsion", name: "Compulsion", description: "An addiction, fixation, obsession, or automatic behavior interferes with this character's judgment or wellbeing." },
    { id: "deception", name: "Deception", description: "This character may be disloyal, habitually dishonest, or determined to present themself more favorably than the truth permits." },
    { id: "greed", name: "Greed", description: "What this character has is never enough, and they may violate rules or others' rights to obtain more." },
    { id: "laziness", name: "Laziness", description: "This character seeks the path of least resistance and can be discouraged by difficult, lengthy, or complicated work." },
    { id: "ignorance", name: "Ignorance", description: "This character lacks important knowledge or social understanding and may resist opportunities to correct that gap." },
    { id: "intolerance", name: "Intolerance", description: "Emotionally rooted prejudice makes this character judge or reject a group of people without a rational basis." },
    { id: "pride", name: "Pride", description: "Arrogance, vanity, or self-importance leads this character to elevate themself at the expense of others." },
    { id: "recklessness", name: "Recklessness", description: "This character gives too little thought to how dangerous or inconsiderate actions may affect themself or others." },
    { id: "timid", name: "Timid", description: "Extreme risk aversion makes this character over-prepare, delay action, or freeze before unfamiliar dangers." }
  ],
  desire: [
    { id: "ambition", name: "Ambition", description: "This character wants power, authority, privilege, status, or rank." },
    { id: "belonging", name: "Belonging", description: "This character wants acceptance and a secure place within a community, team, or faction." },
    { id: "expertise", name: "Expertise", description: "This character strives to master a chosen discipline and practices relentlessly in pursuit of excellence." },
    { id: "fame", name: "Fame", description: "This character wants recognition, attention, praise, and a place in the public eye." },
    { id: "justice", name: "Justice", description: "This character is driven to correct inequality, defend rights, and see others treated fairly." },
    { id: "knowledge", name: "Knowledge", description: "This character wants to uncover information that is hidden, forgotten, forbidden, or tied to their own origins." },
    { id: "love", name: "Love", description: "This character seeks romantic intimacy, either with an existing love or someone they have yet to meet." },
    { id: "safety", name: "Safety", description: "This character seeks physical comfort, dependable necessities, emotional security, or freedom from abuse and oppression." },
    { id: "vengeance", name: "Vengeance", description: "A past wrong drives this character to punish the person, group, or force responsible." },
    { id: "wealth", name: "Wealth", description: "Money and material possessions are this character's primary goal, pursued through work, trade, influence, or theft." }
  ],
  fear: [
    { id: "change", name: "Change", description: "This character depends on routine and stability and dreads upheaval in their daily life." },
    { id: "commitment", name: "Commitment", description: "Promises and responsibility frighten this character, especially when another person must rely on them." },
    { id: "death", name: "Death", description: "A deep, primal fear of dying shapes this character's choices and appetite for risk." },
    { id: "expression", name: "Expression", description: "This character hides a private behavior or form of self-expression and fears its discovery." },
    { id: "failure", name: "Failure", description: "The possibility of falling short may drive this character toward perfection—or leave them unable to act." },
    { id: "humiliation", name: "Humiliation", description: "This character dreads looking foolish or wrong and may sacrifice opportunities to protect their image." },
    { id: "isolation", name: "Isolation", description: "This character fears separation from others and the possibility of living or dying alone." },
    { id: "nemesis", name: "Nemesis", description: "A particular enemy inspires genuine fear, whether or not this character is willing to admit it." },
    { id: "obscurity", name: "Obscurity", description: "This character fears being forgotten and works to secure a lasting legacy." },
    { id: "poverty", name: "Poverty", description: "This character fears being without money, supplies, shelter, or status and hoards security against that possibility." }
  ]
};

export const motivationKeys: MotivationKey[] = ["strength", "flaw", "desire", "fear"];

export function findMotivationOption(key: MotivationKey, id: string) {
  return motivationOptions[key].find((option) => option.id === id);
}
