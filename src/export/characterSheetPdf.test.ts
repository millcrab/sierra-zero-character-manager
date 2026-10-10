import { describe, expect, it } from "vitest";
import { createCharacterDraft } from "../engine/rules";
import { createCharacterSheetModel } from "./characterSheetModel";
import { renderCharacterSheetPdf } from "./characterSheetPdf";

describe("character sheet PDF", () => {
  it("renders a multi-page shareable dossier", () => {
    const character = createCharacterDraft();
    character.status = "complete";
    character.profile.name = "Morgan Vale";
    character.profile.backstory = "A veteran field analyst assigned to incidents where witness accounts and physical evidence disagree. Morgan keeps meticulous notes, trusts the team, and never assumes the impossible is harmless.";
    character.profile.motivations.strength = { optionId: "analytical", detail: "Turns scattered evidence into a plan." };
    character.profile.motivations.flaw = { optionId: "pride", detail: "Finds it difficult to abandon a theory." };
    character.profile.motivations.desire = { optionId: "knowledge", detail: "Wants to map the hidden rules behind anomalies." };
    character.profile.motivations.fear = { optionId: "failure", detail: "Fears missing the clue that could save the team." };
    character.build.purchases.skillRanks = { ranged: 1, vigilance: 1, perception: 2, computers: 1 };
    character.build.purchases.talentNodeIds = ["sf-1-1", "sf-2-1"];
    character.inventory = [
      { instanceId: "preview-pistol", itemId: "heavy-pistol", equipped: true, attachmentIds: [] },
      { instanceId: "preview-armor", itemId: "flak-vest", equipped: true, attachmentIds: [] }
    ];
    const pdf = renderCharacterSheetPdf(createCharacterSheetModel(character));
    const bytes = new Uint8Array(pdf.output("arraybuffer"));
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("%PDF");
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(4);
  });
});
