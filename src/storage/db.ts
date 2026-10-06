import type { Character } from "../types";

const DB_NAME = "sierra-zero-character-manager";
const STORE_NAME = "characters";
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listCharacters(): Promise<Character[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve((request.result as Character[]).map(normalizeCharacter));
    request.onerror = () => reject(request.error);
  });
}

export function normalizeCharacter(character: Character): Character {
  character.build.startingSkillSelections ??= {
    archetypeSkillIds: [],
    archetypeSkillGroups: {},
    careerSkillIds: [],
    specializationSkillIds: []
  };
  character.build.startingSkillSelections.archetypeSkillGroups ??= {};
  character.resources.money ??= 500;
  character.profile.portraitFocusY ??= 50;
  character.inventory = character.inventory.map((instance) => ({ ...instance, attachmentIds: instance.attachmentIds ?? [], attachmentAcquisitions: instance.attachmentAcquisitions ?? {} }));
  return character;
}

export async function saveCharacters(characters: Character[]): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    for (const character of characters) store.put(normalizeCharacter(character));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function saveCharacter(character: Character): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(character);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
