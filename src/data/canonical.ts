import {
  archetypes,
  attachments,
  careers,
  items,
  skills,
  specializations as generatedSpecializations,
  talents,
} from "./canonical.generated";

export { archetypes, attachments, careers, items, skills, talents };

// Apply approved corrections that postdate the published source omnibus.
// The importer contains the same correction so regenerated data will match.
export const specializations = generatedSpecializations.map((specialization) =>
  specialization.id === "counselor"
    ? {
        ...specialization,
        bonusCareerSkillIds: ["charm", "discipline", "leadership", "perception"],
      }
    : specialization,
);

export const specialForces = specializations.find((record) => record.id === "special-forces")!;
export const canonicalData = { skills, talents, specializations, careers, archetypes, items, attachments };
