export interface GameplaySection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface GameplayRule {
  id: string;
  title: string;
  category: "Core checks" | "Structured encounters" | "Combat" | "Social encounters" | "Health and recovery" | "Field conditions" | "Equipment";
  summary: string;
  source: string;
  sections: GameplaySection[];
}

export interface SkillGuide {
  skillId: string;
  summary: string;
  commonUses: string[];
  opposedBy?: string;
  source: string;
}

export interface QualityGuide {
  id: string;
  name: string;
  kind: "active" | "passive";
  activation?: string;
  summary: string;
  source: string;
}

export const gameplayRules: GameplayRule[] = [
  {
    id: "building-a-dice-pool",
    title: "Building a dice pool",
    category: "Core checks",
    summary: "Combine characteristic, skill, difficulty, and situational dice before rolling.",
    source: "CRB 18–22",
    sections: [{ bullets: [
      "Compare the relevant characteristic and skill rank. Add Ability dice equal to the larger number, then upgrade that many Ability dice to Proficiency dice equal to the smaller number.",
      "Add Difficulty dice for the task. Upgrade Difficulty dice to Challenge dice when opposition, danger, or a rule calls for an upgrade.",
      "Add Boost and Setback dice for circumstances, equipment, assistance, injuries, talents, and environmental conditions.",
      "If more upgrades are applied than there are dice to upgrade, add one die of the lower type and continue upgrading. Downgrades reverse this process but never remove dice."
    ] }]
  },
  {
    id: "difficulty-levels",
    title: "Difficulty levels",
    category: "Core checks",
    summary: "Use difficulty from Simple through Formidable to express the task itself.",
    source: "CRB 16–18",
    sections: [{ bullets: [
      "Simple: no Difficulty dice; roll only when the result's side effects matter.",
      "Easy: one Difficulty die; routine for a trained character.",
      "Average: two Difficulty dice; a meaningful professional challenge.",
      "Hard: three Difficulty dice; demanding even for trained characters.",
      "Daunting: four Difficulty dice; exceptional risk or complexity.",
      "Formidable: five Difficulty dice; near the limit of ordinary capability."
    ] }]
  },
  {
    id: "reading-results",
    title: "Reading dice results",
    category: "Core checks",
    summary: "Success and failure determine the outcome; Advantage, Threat, Triumph, and Despair shape what else happens.",
    source: "CRB 22–24",
    sections: [{ bullets: [
      "Cancel Success against Failure and Advantage against Threat. At least one uncanceled Success means the check succeeds.",
      "Advantage and Threat remain meaningful whether the check succeeds or fails. Spend them on useful or harmful side effects that fit the fiction.",
      "Triumph counts as one Success and also produces a major beneficial effect. Despair counts as one Failure and also produces a major complication.",
      "Triumph and Despair do not cancel one another, and their special effects still occur even if their Success or Failure contribution is canceled."
    ] }]
  },
  {
    id: "modifying-checks",
    title: "Boosts, Setbacks, upgrades, and difficulty",
    category: "Core checks",
    summary: "Use different modifications for circumstances, expertise, and genuine danger.",
    source: "CRB 20–21",
    sections: [{ bullets: [
      "Add Boost or Setback dice for temporary circumstances: useful tools, good positioning, poor visibility, injuries, or time pressure.",
      "Upgrade ability when training or a special effect makes Triumph possible. Upgrade difficulty when opposition or danger makes Despair possible.",
      "Increase or decrease difficulty only when the underlying task becomes fundamentally harder or easier, not merely because circumstances are favorable or inconvenient.",
      "Multiple sources normally stack unless a rule says otherwise."
    ] }]
  },
  {
    id: "assistance-opposed-competitive",
    title: "Assistance and opposed checks",
    category: "Core checks",
    summary: "Resolve teamwork, direct opposition, and races without inventing a new subsystem.",
    source: "CRB 26–27",
    sections: [{ heading: "Assistance", bullets: [
      "For skilled assistance, use the better participant's characteristic and the other participant's skill rank to build the positive pool.",
      "For unskilled but meaningful help, add one Boost die. The GM decides whether help is possible and how many people can contribute."
    ] }, { heading: "Opposed and competitive checks", bullets: [
      "For an opposed check, the acting character builds the positive pool normally. The opponent's characteristic and skill build the negative pool: Difficulty dice equal to the higher value, upgraded to Challenge dice equal to the lower value.",
      "For a competitive check, everyone rolls an appropriate check. Rank results by Success, then Advantage, then Triumph; use the fiction to break any remaining tie."
    ] }]
  },
  {
    id: "story-points",
    title: "Story Points",
    category: "Core checks",
    summary: "Story Points move between player and GM pools whenever they are spent.",
    source: "CRB 27–28",
    sections: [{ bullets: [
      "Spend a player Story Point to upgrade a character's ability once, introduce a plausible narrative fact, activate certain talents, or use another explicit rule.",
      "The GM may spend a GM Story Point to upgrade a check's difficulty once, introduce a complication, activate certain NPC abilities, or use another explicit rule.",
      "A spent point immediately flips to the other side. A single check can include both a player upgrade and a GM upgrade.",
      "Story Points change possibility or dramatic weight; they do not simply dictate another character's choices."
    ] }]
  },
  {
    id: "structured-time",
    title: "Narrative and structured time",
    category: "Structured encounters",
    summary: "Use rounds and turns only when the exact order of meaningful actions matters.",
    source: "CRB 94–97",
    sections: [{ paragraphs: [
      "Narrative play handles flexible spans of time. Structured encounters divide action into rounds, with one turn for every participant during each round. A round lasts long enough for each participant to perform one significant activity and reposition or interact with the scene."
    ], bullets: [
      "Begin structured time when timing and order create meaningful pressure.",
      "End it when opposition or time pressure no longer makes individual turns important.",
      "Rules for skills do not change inside an encounter; only the available time and action economy become stricter."
    ] }]
  },
  {
    id: "initiative",
    title: "Initiative and initiative slots",
    category: "Structured encounters",
    summary: "Cool handles prepared starts; Vigilance handles surprise and sudden danger.",
    source: "CRB 95–97",
    sections: [{ bullets: [
      "Each participant makes a Simple Cool check when prepared for the encounter, or a Simple Vigilance check when caught by surprise. The GM decides which applies.",
      "Order results by Success, then Advantage. Player characters win unresolved ties against NPCs.",
      "The results create player and NPC initiative slots, not fixed individual positions. Any eligible character on that side may use the next available slot each round.",
      "After everyone has acted, begin a new round using the same order unless the fiction or a rule changes it."
    ] }]
  },
  {
    id: "turn-economy",
    title: "Turn economy",
    category: "Structured encounters",
    summary: "A normal turn provides one action, one free maneuver, and any reasonable incidentals.",
    source: "CRB 97–101",
    sections: [{ bullets: [
      "Perform one action and one maneuver in either order.",
      "Gain a second maneuver by suffering 2 strain or by exchanging the action for a maneuver. Never perform more than two maneuvers in one turn unless a rule explicitly says otherwise.",
      "Incidentals are brief activities requiring little time or attention, such as speaking a short phrase or dropping an item. The GM may limit excessive incidentals.",
      "An out-of-turn incidental may be used only when its trigger occurs and does not consume the character's next turn."
    ] }]
  },
  {
    id: "actions",
    title: "Actions",
    category: "Structured encounters",
    summary: "An action covers a skill check, combat check, activated ability, or a second maneuver.",
    source: "CRB 101",
    sections: [{ bullets: [
      "Perform a skill check when success is uncertain and failure would matter.",
      "Perform a combat check to attack with an appropriate combat skill and weapon.",
      "Activate a talent, ability, or piece of equipment that specifies an action.",
      "Exchange the action for a maneuver, while respecting the two-maneuver limit.",
      "Lengthy activities may require several actions or may be impossible until the encounter ends."
    ] }]
  },
  {
    id: "combat-check",
    title: "Combat check sequence",
    category: "Combat",
    summary: "Declare, assemble, roll, resolve symbols, then apply damage and Critical Injuries.",
    source: "CRB 101–104",
    sections: [{ bullets: [
      "1. Declare the attack, weapon, combat skill, and target or targets.",
      "2. Build the dice pool from skill and characteristic, then add range difficulty, defense, circumstances, talents, and qualities.",
      "3. Roll. On success, deal the weapon's base damage plus one per uncanceled Success.",
      "4. Spend Advantage and Triumph, including activating item qualities or a Critical Injury when eligible.",
      "5. The GM spends Threat and Despair.",
      "6. Apply soak separately to each hit, suffer remaining wounds, and resolve any Critical Injury."
    ] }]
  },
  {
    id: "attack-difficulty",
    title: "Attack difficulty and range",
    category: "Combat",
    summary: "Close-combat attacks are normally Average; ranged difficulty depends on range band.",
    source: "CRB 102, 105–107",
    sections: [{ bullets: [
      "Brawl and Melee attacks at engaged range are normally Average.",
      "Ranged attacks are Easy at short range, Average at medium, Hard at long, and Daunting at extreme range.",
      "Engaged represents direct physical interaction. Short is nearby, medium is across a large room or street, long is farther than easy conversation, and extreme is the limit of ordinary personal weapons.",
      "Moving within short range or between short and medium requires one maneuver. Moving between medium and long or between long and extreme requires two maneuvers. Engaging or safely disengaging an enemy within short range requires one maneuver."
    ] }]
  },
  {
    id: "defense-cover-concealment",
    title: "Defense, cover, and concealment",
    category: "Combat",
    summary: "Defense adds Setback dice; cover and obscured vision change how attacks are resolved.",
    source: "CRB 104, 110",
    sections: [{ bullets: [
      "Melee defense adds Setback dice to close-combat attacks; ranged defense adds Setback dice to ranged attacks. Defense of the same type does not normally stack—use the best source unless a rule explicitly increases defense.",
      "Ordinary cover grants ranged defense 1. Exceptionally strong prepared cover may justify more defense at the GM's discretion.",
      "Concealment such as darkness, smoke, fog, or foliage adds one to three Setback dice to ranged attacks and sight-based checks: one for light obscurity, two for substantial obscurity, and three for severe obscurity.",
      "The same concealment can add Boost dice to Stealth checks when it meaningfully hides the character."
    ] }]
  },
  {
    id: "engaged-and-prone",
    title: "Engaged ranged attacks and prone targets",
    category: "Combat",
    summary: "Close quarters and body position change attack pools without creating a new range band.",
    source: "CRB 107–108",
    sections: [{ bullets: [
      "A character making a ranged attack while engaged increases its difficulty once for a one-handed weapon such as a pistol and twice for a two-handed weapon such as a rifle. Heavy weapons such as cannons cannot attack while engaged.",
      "Each engaged opponent then adds one Boost die to their next Brawl or Melee check against that attacker, provided they remain engaged.",
      "When firing at a target engaged with an ally, upgrade the attack's difficulty once. Despair may cause the attack to hit the ally instead.",
      "Close-combat attacks against a prone target add one Boost die; a prone attacker adds one Setback die to their own close-combat attacks.",
      "Ranged attacks against a prone target add one Setback die. A prone character does not suffer a general penalty to their own ranged attacks.",
      "Standing from prone requires a maneuver."
    ] }]
  },
  {
    id: "special-attacks",
    title: "Unarmed, improvised, and two-weapon attacks",
    category: "Combat",
    summary: "Common special attacks use the normal combat procedure with a few profile changes.",
    source: "CRB 108–109",
    sections: [{ heading: "Unarmed", bullets: [
      "Use Brawl at engaged range. Base damage equals Brawn, Critical rating is 5, and the attack has Knockdown.",
      "The attacker may choose to deal strain damage instead of wound damage; soak still applies. Brawl weapons modify this profile."
    ] }, { heading: "Two weapons", bullets: [
      "Choose a primary and secondary weapon and use the worse applicable combat pool. Increase the attack's difficulty once.",
      "On a successful attack, the primary weapon hits. Spend two Advantage or one Triumph to also hit with the secondary weapon. Each hit adds the check's Success to its own base damage."
    ] }, { heading: "Improvised weapons", paragraphs: [
      "Use an appropriate close-combat skill and a profile set by the GM for the object's size and construction. Threat or Despair can damage or destroy an improvised weapon."
    ] }]
  },
  {
    id: "silhouette",
    title: "Silhouette and target size",
    category: "Combat",
    summary: "A major difference in size changes attack difficulty by one step.",
    source: "CRB 109",
    sections: [{ bullets: [
      "Most adult humans are silhouette 1.",
      "When attacking a target at least two silhouette points larger than the attacker, decrease the check's difficulty once.",
      "When attacking a target at least two silhouette points smaller than the attacker, increase the check's difficulty once.",
      "Smaller differences do not change difficulty unless another rule or circumstance applies."
    ] }]
  },
  {
    id: "combat-positive-symbols",
    title: "Spending Advantage and Triumph in combat",
    category: "Combat",
    summary: "Use the table as a menu, not a limit on creative results.",
    source: "CRB 104",
    sections: [{ bullets: [
      "1 Advantage: recover 1 strain, add a Boost die to the next allied check, notice an important battlefield detail, or pay an eligible Critical or quality cost.",
      "2 Advantage: take a free maneuver within the normal limit, add a Setback die to the target's next check, or add a Boost die to any ally's next check.",
      "3 Advantage: negate the target's defense for the round, ignore a penalizing environment briefly, temporarily disable a foe or item instead of dealing damage, gain +1 defense until the next turn ends, or force the target to drop a held weapon.",
      "1 Triumph: upgrade an ally's next check, upgrade the target's next difficulty, accomplish something vital, or take a free maneuver after an Initiative check.",
      "2 Triumph: destroy a significant item the target is using when the fiction supports it."
    ] }]
  },
  {
    id: "combat-negative-symbols",
    title: "Spending Threat and Despair in combat",
    category: "Combat",
    summary: "Complications should follow the scene and keep the action moving.",
    source: "CRB 104",
    sections: [{ bullets: [
      "1 Threat: suffer 1 strain or lose the benefit of a prior maneuver until it is performed again.",
      "2 Threat: allow an opponent a free maneuver, add a Boost die to the target's next check, or add a Setback die to the acting character or an ally's next action.",
      "3 Threat: fall prone or grant the opposition a significant situational advantage.",
      "1 Despair: run out of ammunition, upgrade an ally's next difficulty, or damage the tool or weapon being used.",
      "Weapon-specific rules may provide additional expenditures."
    ] }]
  },
  {
    id: "wounds-strain-soak",
    title: "Wounds, strain, and soak",
    category: "Health and recovery",
    summary: "Damage becomes wounds or strain after soak; exceeding either threshold incapacitates a character.",
    source: "CRB 112–114",
    sections: [{ bullets: [
      "Reduce each hit's damage by soak. Suffer any remaining damage as wounds, or as strain when the attack deals strain damage.",
      "Direct strain that is not described as strain damage ignores soak.",
      "When wounds exceed wound threshold, the character is incapacitated and immediately suffers one Critical Injury. Additional wounds may still matter for recovery and further effects.",
      "When strain exceeds strain threshold, the character is incapacitated until strain is reduced to the threshold or lower.",
      "Minions and rivals generally do not track strain separately; strain they suffer is applied as wounds unless their profile says otherwise."
    ] }]
  },
  {
    id: "conditions",
    title: "Disoriented, immobilized, staggered, and prone",
    category: "Health and recovery",
    summary: "The four common conditions restrict checks, movement, actions, or positioning.",
    source: "CRB 100, 113–114",
    sections: [{ bullets: [
      "Disoriented: add one Setback die to every check.",
      "Immobilized: cannot perform maneuvers, though actions and incidentals remain available.",
      "Staggered: cannot perform actions, though maneuvers and incidentals remain available.",
      "Prone: standing requires a maneuver and attack modifiers apply as described in Engaged ranged attacks and prone targets.",
      "Multiple instances normally extend duration only if the originating rule says they do."
    ] }]
  },
  {
    id: "critical-injuries",
    title: "Critical Injuries",
    category: "Health and recovery",
    summary: "Critical Injuries accumulate until treated, making every later Critical Injury more dangerous.",
    source: "CRB 114–116",
    sections: [{ bullets: [
      "Roll d100 when a character suffers a Critical Injury and apply the listed result. Add +10 for every Critical Injury the character is already suffering.",
      "A successful attack may trigger one Critical Injury by spending Advantage equal to the weapon's Critical rating or by spending one Triumph, provided the hit deals damage past soak.",
      "Triggering the Critical rating additional times does not create extra injuries from the same hit; add +10 to the single roll for each additional activation.",
      "A Critical Injury remains recorded until treated, even after a short-duration effect ends.",
      "A result of 151 or higher is immediately fatal unless an explicit rule prevents it."
    ] }]
  },
  {
    id: "healing-recovery",
    title: "Healing and recovery",
    category: "Health and recovery",
    summary: "Characters recover strain quickly, wounds more slowly, and Critical Injuries only through treatment or rest.",
    source: "CRB 116–117",
    sections: [{ bullets: [
      "After an encounter, make a Simple Discipline or Cool check and recover 1 strain per Success. Advantage may also recover strain when spent during play.",
      "A patient may benefit from one Medicine check for wounds per encounter. Difficulty is Easy at half wound threshold or less, Average above half, and Hard after exceeding the threshold. On success, heal wounds equal to Success and strain equal to Advantage.",
      "Treating yourself increases the check's difficulty twice, and lacking appropriate medical tools increases it once.",
      "A character recovers one wound per full night's rest. At the end of a full week of rest, make a Resilience check to recover from one Critical Injury.",
      "A Medicine check to heal a Critical Injury uses the injury's severity. Only one attempt may be made per injury per week.",
      "Administering painkillers to an engaged character requires one maneuver. They heal 5 wounds, then one fewer wound for each prior dose used that day; a sixth dose has no effect. Painkillers never heal Critical Injuries."
    ] }]
  },
  {
    id: "social-checks",
    title: "Social checks and opposition",
    category: "Social encounters",
    summary: "Choose the approach, then oppose it with the target's ability to recognize or resist that approach.",
    source: "CRB 54–56, 118–119",
    sections: [{ bullets: [
      "Charm is generally opposed by Cool.",
      "Coercion and Leadership are generally opposed by Discipline.",
      "Deception is generally opposed by Vigilance.",
      "Negotiation is generally opposed by Negotiation.",
      "Use a set difficulty instead when persuading a group, dealing with an institution, or facing an obstacle without one clear opposing character.",
      "A successful social check influences behavior but does not erase agency, compel impossible conduct, or replace roleplaying."
    ] }]
  },
  {
    id: "social-encounters",
    title: "Structured social encounters",
    category: "Social encounters",
    summary: "Track social pressure as strain and use Motivations to make arguments more effective.",
    source: "CRB 118–122",
    sections: [{ bullets: [
      "Use structured social encounters when several exchanges, competing goals, or time pressure make a single check insufficient.",
      "Successful social checks commonly inflict strain equal to Success. Exceeding strain threshold can represent conceding, withdrawing, revealing something, or otherwise being socially defeated rather than falling unconscious.",
      "Arguments that genuinely leverage a known Motivation facet may add Boost dice or otherwise improve the check; arguments that clash with a Motivation can add Setback dice.",
      "For one acting character addressing a group: Average for 2–5 targets, Hard for 6–15, Daunting for 16–50, and Formidable for more than 50.",
      "The GM should define what victory and concession mean before the encounter so social damage cannot produce implausible control."
    ] }]
  },
  {
    id: "social-symbols",
    title: "Spending symbols in social encounters",
    category: "Social encounters",
    summary: "Social side effects reveal information, change momentum, or expose the speaker's own position.",
    source: "CRB 121",
    sections: [{ heading: "Advantage and Triumph", bullets: [
      "1 Advantage: recover 1 strain, help the next ally, or notice an important detail.",
      "2 Advantage: learn the target's Strength or Flaw, hinder the target's next check, or help any ally's next check.",
      "3 Advantage: learn the target's Desire or Fear, conceal the acting character's true goal, or identify the target's true goal.",
      "1 Triumph: learn a Motivation facet, upgrade an ally's next check, upgrade the target's next difficulty, or accomplish something vital in the scene."
    ] }, { heading: "Threat and Despair", bullets: [
      "1 Threat: suffer 1 strain or become briefly distracted.",
      "2 Threat: reveal a Strength or Flaw, help the target's next check, or hinder the acting character or an ally.",
      "3 Threat: reveal a Desire, Fear, or true goal.",
      "1 Despair: reveal an ally's Motivation, accept a convincing false read of the target, upgrade an allied check's difficulty, or lose the next meaningful action to the complication."
    ] }]
  },
  {
    id: "terrain-movement",
    title: "Difficult terrain, obstacles, and movement",
    category: "Field conditions",
    summary: "Terrain changes the maneuver cost of movement and may require a check when failure matters.",
    source: "CRB 100, 110–112",
    sections: [{ bullets: [
      "Difficult terrain normally requires twice as many maneuvers to cross the same distance.",
      "Impassable terrain cannot be crossed by ordinary movement; overcoming it may require an action and an Athletics or Coordination check.",
      "Swimming is generally difficult terrain. Strong currents, storms, or dangerous water may require Athletics.",
      "Moving through hazardous terrain can add Setback dice, inflict wounds or strain, or create Threat and Despair expenditures as appropriate."
    ] }]
  },
  {
    id: "environmental-hazards",
    title: "Environmental hazards",
    category: "Field conditions",
    summary: "Fire, falling, suffocation, and other hazards use damage, strain, checks, and escalating danger.",
    source: "CRB 110–112",
    sections: [{ bullets: [
      "Fire, acid, and corrosive exposure have a rating, usually 1–10. At the start of each exposed turn, suffer wounds equal to the rating; this is direct wound loss rather than ordinary damage reduced by soak. Escape, extinguishing, or neutralization ends continuing exposure as appropriate.",
      "A short-range fall deals 10 damage and 10 strain; medium deals 30 damage and 20 strain; long inflicts wounds equal to wound threshold +1, 30 strain, and a Critical Injury at +50; extreme inflicts wounds equal to wound threshold +1, 40 strain, and a Critical Injury at +75 or death at GM discretion. Soak reduces falling damage but not falling strain.",
      "An Average Athletics or Coordination check may reduce falling damage by 1 per Success and falling strain by 1 per Advantage. Triumph may reduce the effective fall by one range band when the fiction allows.",
      "A character can normally hold their breath for rounds equal to Brawn. After that, suffocation inflicts 3 strain at the start of every turn. Once incapacitated, the character also suffers one Critical Injury at the start of every later turn until breathing resumes.",
      "Extreme heat, cold, toxins, radiation, storms, and similar hazards commonly call for Resilience checks. Increase difficulty or frequency as exposure worsens.",
      "Use the smallest rule that communicates the danger clearly; not every hazard needs a bespoke subsystem."
    ] }]
  },
  {
    id: "fear",
    title: "Fear checks",
    category: "Field conditions",
    summary: "Fear checks measure whether a character can act effectively in the face of immediate horror or danger.",
    source: "CRB 243–244",
    sections: [{ bullets: [
      "Make a Discipline check when a frightening event could overwhelm the character. Difficulty reflects the severity and immediacy of the threat.",
      "Use Easy for a startling or merely unsettling event, Average for credible but not immediately mortal danger, Hard for imminent potentially mortal danger, Daunting for a confrontation likely to end in death, and Formidable for a hopeless or incomprehensible terror.",
      "Failure commonly adds Setback dice to the character's checks while the fear persists. Threat may inflict strain or cost actions; Despair may produce panic, freezing, flight, or a lasting consequence.",
      "Success means the character can act, not that they feel no fear. Advantage and Triumph can steady allies or provide insight into the threat.",
      "Repeat a fear check only when the danger materially escalates or changes."
    ] }]
  },
  {
    id: "mental-trauma",
    title: "Mental trauma (optional)",
    category: "Field conditions",
    summary: "A horror-focused campaign can let severe failed fear checks create lasting traumas.",
    source: "CRB 244",
    sections: [{ bullets: [
      "If the GM uses this optional rule, failing a fear check with Despair or five Threat also inflicts a trauma with severity matching the fear check.",
      "Easy trauma is an Obsession that can hinder social checks; Average is a Phobia that becomes a new Fear; Hard is a Delusion that can hinder Perception and Willpower checks; Daunting is a Neurosis that adds 1 strain whenever strain is gained; Formidable is a Broken Mind that halves strain threshold, rounding up.",
      "Triumph on a successful fear check may remove one trauma with severity no greater than that check's difficulty. Therapy, medication, recovery, or other treatment may also remove or suppress a trauma with GM approval.",
      "Sierra Zero does not automatically track traumas; the group should opt into this rule before using it."
    ] }]
  },
  {
    id: "gravity-vacuum",
    title: "Gravity and vacuum",
    category: "Field conditions",
    summary: "Unusual gravity changes physical checks; unprotected vacuum combines wounds with suffocation.",
    source: "CRB 110–111",
    sections: [{ bullets: [
      "Strong gravity adds up to three Setback dice to Brawn-based checks other than Resilience and to Coordination. Weak gravity adds up to three Boost dice to those checks.",
      "Zero-gravity movement is difficult terrain and permits three-dimensional positioning. Encumbrance remains unchanged because bulk and inertia still matter.",
      "In vacuum without protection, hold breath for rounds equal to Brawn. Each round of exposure also inflicts 3 wounds.",
      "After the breath limit, apply suffocation as well. Once wound threshold is exceeded, vacuum inflicts one additional Critical Injury during every later exposed round."
    ] }]
  },
  {
    id: "encumbrance",
    title: "Encumbrance and carrying gear",
    category: "Equipment",
    summary: "Encumbrance abstracts weight, bulk, and how awkward equipment is to carry under pressure.",
    source: "CRB 84–85",
    sections: [{ bullets: [
      "A character's encumbrance threshold is normally 5 plus Brawn.",
      "For each point carried above the threshold, add one Setback die to Agility- and Brawn-based checks. If excess encumbrance equals or exceeds Brawn, the character no longer gains a free maneuver; each maneuver costs 2 strain, while the normal limit of two maneuvers still applies.",
      "Worn armor normally counts three less encumbrance than listed, to a minimum of zero.",
      "A character can briefly lift more than they can carry when the GM permits it, usually with Athletics and increased difficulty."
    ] }]
  },
  {
    id: "gear-rarity-tools",
    title: "Rarity, tools, and equipment condition",
    category: "Equipment",
    summary: "Equipment establishes what is possible, how hard it is to obtain, and whether penalties apply.",
    source: "CRB 82–93",
    sections: [{ bullets: [
      "Rarity runs from 0 to 10 and measures how difficult an item is to locate. Availability still depends on place, circumstances, and the GM's judgment.",
      "The correct tool may permit a check that would otherwise be impossible or remove penalties for inadequate equipment. Improvised or missing tools commonly add Setback dice or increase difficulty.",
      "Minor damage adds one Setback die to the item's checks; moderate damage increases their difficulty once; major damage makes the item unusable. Further serious damage can destroy it.",
      "Repair checks use Mechanics: Easy for minor damage, Average for moderate damage, and Hard for major damage. Repairs also require suitable tools, parts, time, and access."
    ] }]
  },
  {
    id: "conceal-selling-gear",
    title: "Concealing, selling, and trading gear",
    category: "Equipment",
    summary: "Use opposed checks for hidden equipment and simple success bands when selling items.",
    source: "CRB 82–85",
    sections: [{ heading: "Concealing gear", bullets: [
      "Hiding an item normally requires no roll. A deliberate search is Perception opposed by the carrier's Stealth; casual observation is Vigilance opposed by Stealth.",
      "Add one Boost die to the searcher's pool for every point by which the largest hidden item's encumbrance exceeds 1. Apply the same principle when an item is hidden in the environment."
    ] }, { heading: "Selling and trading", bullets: [
      "To find a buyer, make Negotiation against the difficulty set by local rarity. A successful check normally sells the item for one-quarter of listed cost, two Success for one-half, or three or more Success for three-quarters.",
      "Use Streetwise instead of Negotiation for illegal goods. Differences in local rarity may alter value when the group deliberately engages in trade.",
      "The GM determines whether a market exists and may adjust price for condition, urgency, legality, volume, and circumstances."
    ] }]
  }
];

export const skillGuides: SkillGuide[] = [
  { skillId: "athletics", summary: "Strength, conditioning, and controlled physical exertion.", commonUses: ["Climbing, swimming, jumping, lifting, grappling, and sustained exertion", "Breaking restraints or forcing obstacles", "Crossing hazardous terrain when raw power matters"], source: "CRB 58" },
  { skillId: "brawl", summary: "Unarmed fighting and weapons designed to augment an unarmed attack.", commonUses: ["Punches, kicks, holds, and close-quarters control", "Using brass knuckles or other Brawl weapons", "Dealing wounds or choosing strain damage with an unarmed attack"], source: "CRB 67" },
  { skillId: "charm", summary: "Persuasion through warmth, attraction, empathy, and sincere appeal.", commonUses: ["Making a positive first impression", "Winning cooperation through rapport", "Flirting, reassuring, or appealing to shared feeling"], opposedBy: "Cool", source: "CRB 54" },
  { skillId: "coercion", summary: "Influence through threat, pressure, intimidation, or implied consequences.", commonUses: ["Forcing immediate compliance", "Breaking resistance through fear", "Establishing credible consequences"], opposedBy: "Discipline", source: "CRB 55" },
  { skillId: "computers", summary: "Using, diagnosing, securing, and exploiting digital systems.", commonUses: ["Finding or analyzing digital information", "Operating unfamiliar software and networks", "Bypassing access controls or protecting data using ordinary skill checks"], source: "CRB 58" },
  { skillId: "cool", summary: "Composure, patience, preparation, and the ability to act deliberately under pressure.", commonUses: ["Initiative when prepared for trouble", "Resisting Charm", "Maintaining a cover identity or waiting for the right moment", "Recovering strain after an encounter"], source: "CRB 59" },
  { skillId: "coordination", summary: "Balance, flexibility, precise body control, and quick physical adjustment.", commonUses: ["Balancing, tumbling, squeezing through gaps, and landing safely", "Escaping bonds when finesse matters", "Reducing or avoiding certain movement hazards"], source: "CRB 59" },
  { skillId: "deception", summary: "Creating a believable falsehood, disguise, misdirection, or concealed intent.", commonUses: ["Lying convincingly", "Maintaining a false identity", "Misdirecting attention or disguising a true goal"], opposedBy: "Vigilance", source: "CRB 56" },
  { skillId: "discipline", summary: "Self-command, mental endurance, concentration, and resistance to pressure.", commonUses: ["Resisting Coercion and Leadership", "Fear checks and concentration under stress", "Recovering strain after an encounter", "Maintaining control against emotional or psychological pressure"], source: "CRB 60" },
  { skillId: "driving", summary: "Operating ground vehicles under ordinary or hazardous conditions.", commonUses: ["Controlling cars, motorcycles, trucks, and similar vehicles", "Handling chases, obstacles, poor terrain, or damaged vehicles", "Understanding practical limits of ground transport"], source: "CRB 60" },
  { skillId: "gunnery", summary: "Operating crew-served, mounted, or exceptionally heavy weapons.", commonUses: ["Machine guns, launchers, and heavy support weapons", "Aiming systems or mounts that require specialized operation", "Attacks with weapons explicitly assigned to Gunnery"], source: "CRB 69" },
  { skillId: "knowledge", summary: "Broad education and recall outside a more specific field.", commonUses: ["Remembering established facts", "Recognizing organizations, history, and professional conventions", "Connecting research from multiple disciplines"], source: "CRB 66" },
  { skillId: "knowledge-science", summary: "Formal scientific theory, experimental practice, and technical interpretation.", commonUses: ["Designing or evaluating experiments", "Interpreting laboratory or field data", "Recognizing biological, chemical, physical, or geological phenomena"], source: "Sierra Zero specialization of CRB 66" },
  { skillId: "knowledge-society", summary: "Institutions, cultures, law, politics, customs, and organized human behavior.", commonUses: ["Understanding agencies, communities, and power structures", "Recognizing legal, political, or cultural context", "Predicting institutional reactions"], source: "Sierra Zero specialization of CRB 66" },
  { skillId: "leadership", summary: "Directing, inspiring, organizing, and establishing legitimate authority.", commonUses: ["Coordinating a team under pressure", "Restoring morale or creating confidence", "Convincing others to follow a plan or accept responsibility"], opposedBy: "Discipline", source: "CRB 56" },
  { skillId: "mechanics", summary: "Building, repairing, modifying, and diagnosing physical machinery and equipment.", commonUses: ["Repairing damaged gear", "Understanding mechanical failures", "Constructing or modifying devices with suitable tools and parts"], source: "CRB 60" },
  { skillId: "medicine", summary: "Diagnosing injury and illness and providing effective treatment.", commonUses: ["Healing wounds during or after an encounter", "Treating Critical Injuries", "Diagnosing disease, poison, trauma, or cause of death"], source: "CRB 61" },
  { skillId: "melee", summary: "Close combat with general hand weapons not assigned to a more specific Melee skill.", commonUses: ["Striking, parrying, and controlling distance with a hand weapon", "Using improvised weapons when appropriate", "Attacks with weapons explicitly assigned to Melee"], source: "CRB 68" },
  { skillId: "melee-heavy", summary: "Close combat with large, two-handed, or reach-focused weapons.", commonUses: ["Heavy axes, greatswords, polearms, and similar weapons", "Using reach or mass to control close quarters", "Attacks with weapons explicitly assigned to Melee (Heavy)"], source: "CRB 68" },
  { skillId: "melee-light", summary: "Close combat with fast, compact, or one-handed weapons.", commonUses: ["Knives, batons, swords, and similar weapons", "Fighting in confined spaces", "Attacks with weapons explicitly assigned to Melee (Light)"], source: "CRB 68" },
  { skillId: "negotiation", summary: "Reaching an exchange through bargaining, valuation, leverage, and compromise.", commonUses: ["Prices, contracts, and trades", "Finding mutually acceptable terms", "Understanding what another party values"], opposedBy: "Negotiation", source: "CRB 56" },
  { skillId: "perception", summary: "Active observation and deliberate searching with the senses.", commonUses: ["Searching a location or person", "Spotting concealed details and physical evidence", "Noticing an ambush when actively on guard"], source: "CRB 62" },
  { skillId: "piloting", summary: "Operating aircraft, watercraft, and other vehicles requiring three-dimensional control.", commonUses: ["Flying aircraft or piloting boats", "Handling difficult approaches, weather, or evasive movement", "Understanding the practical limits of specialized vehicles"], source: "CRB 62" },
  { skillId: "ranged", summary: "General attacks with ranged weapons not assigned to a more specific Ranged skill.", commonUses: ["Attacks with setting-neutral ranged weapons", "Thrown or unusual weapons assigned to Ranged", "Applying the normal range-band attack difficulties"], source: "CRB 68" },
  { skillId: "ranged-heavy", summary: "Attacks with rifles, shotguns, bows, and other shoulder-fired or two-handed ranged weapons.", commonUses: ["Rifles, shotguns, bows, and crossbows", "Longer-ranged personal weapon fire", "Attacks with weapons explicitly assigned to Ranged (Heavy)"], source: "CRB 69" },
  { skillId: "ranged-light", summary: "Attacks with pistols, grenades, and compact or one-handed ranged weapons.", commonUses: ["Pistols and other sidearms", "Thrown grenades and compact launchers", "Attacks with weapons explicitly assigned to Ranged (Light)"], source: "CRB 68" },
  { skillId: "resilience", summary: "Endurance against fatigue, deprivation, poison, disease, and environmental stress.", commonUses: ["Resisting heat, cold, toxins, hunger, or sleep loss", "Sustaining prolonged physical effort", "Recovering from Critical Injuries through rest"], source: "CRB 63" },
  { skillId: "skulduggery", summary: "Locks, traps, concealment, sleight of hand, and practical criminal technique.", commonUses: ["Picking locks and bypassing physical security", "Planting or lifting small objects unnoticed", "Recognizing traps, illicit methods, or tampering"], source: "CRB 64" },
  { skillId: "stealth", summary: "Avoiding notice through concealment, silence, timing, and controlled movement.", commonUses: ["Hiding and moving quietly", "Tailing someone without being noticed", "Using darkness, crowds, terrain, or distraction as concealment"], source: "CRB 64" },
  { skillId: "streetwise", summary: "Reading informal networks, criminal markets, local pressures, and life outside official channels.", commonUses: ["Finding illicit goods or contacts", "Understanding gangs, scams, and neighborhood dynamics", "Gathering rumors without formal research"], source: "CRB 65" },
  { skillId: "survival", summary: "Travel, tracking, navigation, and staying alive away from reliable infrastructure.", commonUses: ["Tracking people or animals", "Finding food, water, shelter, and a safe route", "Recognizing natural hazards, weather, and signs of passage"], source: "CRB 65" },
  { skillId: "vigilance", summary: "Readiness, instinctive awareness, and reaction to sudden danger.", commonUses: ["Initiative when surprised", "Resisting Deception", "Noticing danger when not actively searching", "Remembering whether the character prepared a reasonable item or precaution"], source: "CRB 65" }
];

export const qualityGuides: QualityGuide[] = [
  { id: "accurate", name: "Accurate", kind: "passive", summary: "Add one Boost die to attacks with the weapon per rating.", source: "CRB 86" },
  { id: "auto-fire", name: "Auto-Fire", kind: "active", activation: "2 Advantage per additional hit", summary: "Before rolling, increase difficulty once to use Auto-Fire and declare eligible targets. On a hit, each activation adds another hit using the same Success total; additional hits may strike declared targets in range.", source: "CRB 86" },
  { id: "blast", name: "Blast", kind: "active", activation: "2 Advantage; 3 Advantage on a miss", summary: "On a hit, characters engaged with the target suffer a hit equal to the Blast rating plus Success. On a miss, the special activation also hits the original target.", source: "CRB 86" },
  { id: "breach", name: "Breach", kind: "passive", summary: "Ignore 10 points of personal-scale soak per rating. Breach also ignores one point of vehicle armor per rating when that scale is used.", source: "CRB 87" },
  { id: "burn", name: "Burn", kind: "active", activation: "2 Advantage", summary: "The target suffers the weapon's base damage at the start of each turn for rounds equal to the rating. Suitable action and circumstances may extinguish an ordinary flame.", source: "CRB 87" },
  { id: "concussive", name: "Concussive", kind: "active", activation: "2 Advantage", summary: "The target is staggered for rounds equal to the rating and cannot perform actions during that time.", source: "CRB 87" },
  { id: "cumbersome", name: "Cumbersome", kind: "passive", summary: "If Brawn is below the rating, increase the difficulty of checks using the item once per missing point of Brawn.", source: "CRB 87" },
  { id: "defensive", name: "Defensive", kind: "passive", summary: "Increase melee defense by the rating while wielding or using the item.", source: "CRB 87" },
  { id: "deflection", name: "Deflection", kind: "passive", summary: "Increase ranged defense by the rating while wielding or using the item.", source: "CRB 87" },
  { id: "disorient", name: "Disorient", kind: "active", activation: "2 Advantage", summary: "The target is disoriented for rounds equal to the rating, adding one Setback die to every check.", source: "CRB 87" },
  { id: "ensnare", name: "Ensnare", kind: "active", activation: "2 Advantage", summary: "The target is immobilized for rounds equal to the rating. The target may use an action for a Hard Athletics check to break free.", source: "CRB 87" },
  { id: "guided", name: "Guided", kind: "active", activation: "3 Advantage after a miss", summary: "At the end of the round, make an Average attack using Ability dice equal to the Guided rating instead of the normal positive pool. On another miss, Guided may activate again.", source: "CRB 87" },
  { id: "inaccurate", name: "Inaccurate", kind: "passive", summary: "Add one Setback die to attacks with the weapon per rating.", source: "CRB 87" },
  { id: "inferior", name: "Inferior", kind: "passive", summary: "Checks using the item add one automatic Threat.", source: "CRB 88" },
  { id: "knockdown", name: "Knockdown", kind: "active", activation: "2 Advantage, plus 1 per silhouette above 1", summary: "Knock the target prone.", source: "CRB 88" },
  { id: "limited-ammo", name: "Limited Ammo", kind: "passive", summary: "The weapon can make attacks equal to the rating before it needs a maneuver to reload. Each attack also consumes scarce ammunition that must be obtained separately.", source: "CRB 88" },
  { id: "linked", name: "Linked", kind: "active", activation: "2 Advantage per additional hit", summary: "On a successful attack, add another hit against the original target per activation, up to the Linked rating. Each hit uses the same Success total.", source: "CRB 88" },
  { id: "pierce", name: "Pierce", kind: "passive", summary: "Ignore soak equal to the rating for each hit, to a maximum of the target's soak.", source: "CRB 88" },
  { id: "prepare", name: "Prepare", kind: "passive", summary: "Perform preparation maneuvers equal to the rating before using the item. Significant movement or disruption may require preparing it again.", source: "CRB 88" },
  { id: "reinforced", name: "Reinforced", kind: "passive", summary: "Reinforced items are immune to Sunder. Reinforced armor prevents Pierce and Breach from reducing its soak.", source: "CRB 88" },
  { id: "slow-firing", name: "Slow-Firing", kind: "passive", summary: "After attacking, wait rounds equal to the rating before the weapon can attack again.", source: "CRB 88" },
  { id: "stun", name: "Stun", kind: "active", activation: "2 Advantage", summary: "Inflict strain equal to the rating. This is direct strain, not strain damage, so soak does not reduce it.", source: "CRB 88" },
  { id: "stun-damage", name: "Stun Damage", kind: "passive", summary: "The weapon deals strain damage instead of wounds. Because it is damage, soak still reduces it.", source: "CRB 88" },
  { id: "sunder", name: "Sunder", kind: "active", activation: "1 Advantage", summary: "Damage one openly wielded item by one step, even on a miss. Multiple activations against the same item can progress from undamaged through minor, moderate, and major damage to destruction.", source: "CRB 88" },
  { id: "superior", name: "Superior", kind: "passive", summary: "Checks using the item add one automatic Advantage.", source: "CRB 88" },
  { id: "unwieldy", name: "Unwieldy", kind: "passive", summary: "If Agility is below the rating, increase the difficulty of checks using the item once per missing point of Agility.", source: "CRB 89" },
  { id: "vicious", name: "Vicious", kind: "passive", summary: "Add +10 to Critical Injury rolls per rating when the weapon inflicts a Critical Injury.", source: "CRB 89" }
];

export const gameplayCategories = [
  "Core checks",
  "Structured encounters",
  "Combat",
  "Social encounters",
  "Health and recovery",
  "Field conditions",
  "Equipment"
] as const;
