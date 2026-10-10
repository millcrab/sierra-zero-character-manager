import type { ArchetypeRecord } from "../types";
import { formattedArchetypeAbilities } from "../data/archetypeFormatting";
import { GameText } from "./DiceSymbols";

export function ArchetypeAbilities({ archetype, headingLevel = 3 }: { archetype: ArchetypeRecord; headingLevel?: 3 | 4 }) {
  const Heading = `h${headingLevel}` as "h3" | "h4";
  return <div className="archetype-abilities">
    {formattedArchetypeAbilities(archetype).map((ability) => <section key={ability.id} className="archetype-ability">
      <Heading>{ability.name}</Heading>
      <p><GameText>{ability.rules}</GameText></p>
    </section>)}
  </div>;
}
