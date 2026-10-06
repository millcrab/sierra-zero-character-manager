import type { ManeuverRecord } from "../types";

export const maneuvers: ManeuverRecord[] = [
  { id: "aim", name: "Aim", summary: "Improve the next combat check.", rules: "Gain one Boost die on the next combat check, or target a specific item or location. A second Aim maneuver can add another Boost die." },
  { id: "assist", name: "Assist", summary: "Help an engaged ally.", rules: "Provide assistance to an engaged ally's next appropriate check. The GM determines whether skilled or unskilled assistance applies." },
  { id: "guarded-stance", name: "Guarded Stance", summary: "Trade offense for melee protection.", rules: "Suffer one Setback die on combat checks until the end of the next turn and gain +1 melee defense for the same duration." },
  { id: "interact", name: "Interact with Environment", summary: "Use a nearby object or feature.", rules: "Open a door, press a control, take cover, or perform another simple environmental interaction." },
  { id: "manage-gear", name: "Manage Gear", summary: "Draw, holster, ready, or stow equipment.", rules: "Manage one accessible item. Some especially awkward or secured equipment may require more effort at the GM's discretion." },
  { id: "mount", name: "Mount or Dismount", summary: "Enter or leave a vehicle or mount.", rules: "Mount, dismount, enter, or leave something within reach when circumstances allow." },
  { id: "move", name: "Move", summary: "Change position by one range band.", rules: "Move between engaged and short range, or between short and medium range. Greater distances require additional maneuvers." },
  { id: "prepare", name: "Prepare", summary: "Perform required setup for an action.", rules: "Complete one preparation maneuver required by a weapon, item, talent, or planned action." },
  { id: "stand", name: "Stand from Prone", summary: "Stand up or drop prone.", rules: "Stand from prone. Dropping prone is also a maneuver and may change the difficulty of ranged attacks as the GM applies the rules." }
];
