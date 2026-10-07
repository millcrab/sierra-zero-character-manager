import { archetypes, careers, items, skills, specializations } from "../data/canonical";
import type { Character } from "../types";
import { normalizeCharacter } from "./db";

export const EXPORT_FORMAT = "sierra-zero-character-backup";
export const CURRENT_SCHEMA_VERSION = 1;

export interface CharacterBackup {
  format: typeof EXPORT_FORMAT;
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  exportedAt: string;
  characters: Character[];
}

export function createBackup(characters: Character[], exportedAt = new Date().toISOString()): CharacterBackup {
  return { format: EXPORT_FORMAT, schemaVersion: CURRENT_SCHEMA_VERSION, exportedAt, characters };
}

export function serializeBackup(characters: Character[]): string {
  return JSON.stringify(createBackup(characters), null, 2);
}

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function validateCharacter(value: unknown): string[] {
  if (!isRecord(value)) return ["Character entry is not an object."];
  const errors: string[] = [];
  if (value.schemaVersion !== CURRENT_SCHEMA_VERSION) errors.push(`Unsupported character schema version: ${String(value.schemaVersion)}.`);
  if (typeof value.id !== "string" || !value.id) errors.push("Character id is missing.");
  if (!isRecord(value.profile) || typeof value.profile.name !== "string") errors.push("Character profile is invalid.");
  if (!isRecord(value.build)) return [...errors, "Character build is missing."];
  const build = value.build;
  if (!archetypes.some((record) => record.id === build.archetypeId)) errors.push(`Unknown archetype: ${String(build.archetypeId)}.`);
  if (!careers.some((record) => record.id === build.careerId)) errors.push(`Unknown career: ${String(build.careerId)}.`);
  const specializationIds = Array.isArray(build.specializationIds) ? build.specializationIds : [];
  for (const id of specializationIds) if (!specializations.some((record) => record.id === id)) errors.push(`Unknown specialization: ${String(id)}.`);
  const purchases = isRecord(build.purchases) ? build.purchases : {};
  const purchasedSkills = isRecord(purchases.skillRanks) ? Object.keys(purchases.skillRanks) : [];
  for (const id of purchasedSkills) if (!skills.some((record) => record.id === id)) errors.push(`Unknown skill: ${id}.`);
  const validNodes = new Set(specializations.filter((record) => specializationIds.includes(record.id)).flatMap((record) => record.nodes.map((node) => node.id)));
  const nodeIds = Array.isArray(purchases.talentNodeIds) ? purchases.talentNodeIds : [];
  for (const id of nodeIds) if (!validNodes.has(String(id))) errors.push(`Unknown talent node: ${String(id)}.`);
  const inventory = Array.isArray(value.inventory) ? value.inventory : [];
  for (const instance of inventory) if (!isRecord(instance) || !items.some((record) => record.id === instance.itemId)) errors.push(`Unknown inventory item: ${isRecord(instance) ? String(instance.itemId) : "invalid entry"}.`);
  return errors;
}

export function parseBackup(text: string): Character[] {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error("This is not valid JSON."); }
  if (!isRecord(parsed) || parsed.format !== EXPORT_FORMAT) throw new Error("This is not a Sierra Zero character backup.");
  if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) throw new Error(`Backup schema version ${String(parsed.schemaVersion)} is not supported by this app.`);
  if (!Array.isArray(parsed.characters) || parsed.characters.length === 0) throw new Error("The backup contains no characters.");
  const errors = parsed.characters.flatMap((character, index) => validateCharacter(character).map((error) => `Character ${index + 1}: ${error}`));
  if (errors.length) throw new Error(errors.slice(0, 6).join(" "));
  return (parsed.characters as Character[]).map((character) => normalizeCharacter(structuredClone(character)));
}

export function mergeImportedCharacters(current: Character[], imported: Character[]): Character[] {
  const byId = new Map(current.map((character) => [character.id, character]));
  for (const character of imported) {
    const existing = byId.get(character.id);
    if (!existing || character.metadata.updatedAt >= existing.metadata.updatedAt) byId.set(character.id, character);
  }
  return [...byId.values()].sort((a, b) => b.metadata.updatedAt.localeCompare(a.metadata.updatedAt));
}
