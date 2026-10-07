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

  it("keeps the newest timestamp when several backups contain the same character", () => {
    const current = createCharacterDraft();
    current.profile.name = "Current";
    current.metadata.updatedAt = "2026-10-06T15:00:00.000Z";
    const older = structuredClone(current);
    older.profile.name = "Older backup";
    older.metadata.updatedAt = "2026-10-01T15:00:00.000Z";
    const newer = structuredClone(current);
    newer.profile.name = "Newest backup";
    newer.metadata.updatedAt = "2026-10-06T16:00:00.000Z";
    const merged = mergeImportedCharacters([current], [newer, older]);
    expect(merged).toHaveLength(1);
    expect(merged[0].profile.name).toBe("Newest backup");
  });

  it("migrates legacy free-text motivations into agent-specific detail", () => {
    const character = createCharacterDraft();
    (character.profile.motivations as unknown as Record<string, string>).strength = "Never gives up";
    const restored = parseBackup(serializeBackup([character]));
    expect(restored[0].profile.motivations.strength).toEqual({ optionId: "", detail: "Never gives up" });
  });
});
