import { describe, expect, it } from "vitest";
import { createCharacterDraft } from "../engine/rules";
import { createBackup, mergeImportedCharacters, parseBackup, serializeBackup } from "./transfer";

describe("character backup transfer", () => {
  it("round-trips a character with its portrait and state", () => {
    const character = createCharacterDraft();
    character.profile.name = "Agent Test";
    character.profile.portraitDataUrl = "data:image/png;base64,AA==";
    const restored = parseBackup(serializeBackup([character]));
    expect(restored).toEqual([character]);
  });

  it("rejects unknown schemas and canonical ids", () => {
    const character = createCharacterDraft();
    const newer = createBackup([character]) as unknown as { schemaVersion: number };
    newer.schemaVersion = 99;
    expect(() => parseBackup(JSON.stringify(newer))).toThrow(/not supported/);
    character.build.archetypeId = "not-real";
    expect(() => parseBackup(serializeBackup([character]))).toThrow(/Unknown archetype/);
  });

  it("replaces matching ids and preserves unrelated characters", () => {
    const existing = createCharacterDraft();
    const replacement = structuredClone(existing);
    replacement.profile.name = "Replacement";
    const other = createCharacterDraft();
    const merged = mergeImportedCharacters([existing, other], [replacement]);
    expect(merged).toHaveLength(2);
    expect(merged.find((character) => character.id === existing.id)?.profile.name).toBe("Replacement");
  });
});
