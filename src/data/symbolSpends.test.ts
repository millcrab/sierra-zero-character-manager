import { describe, expect, it } from "vitest";
import { symbolSpendReferences } from "./symbolSpends";

describe("encounter symbol spend references", () => {
  it("covers all four narrative symbols in combat and social scenes", () => {
    for (const reference of Object.values(symbolSpendReferences)) {
      const symbols = new Set([...reference.positive, ...reference.negative].map((spend) => spend.cost.symbol));
      expect(symbols).toEqual(new Set(["advantage", "triumph", "threat", "despair"]));
      expect(reference.source).toMatch(/CRB/);
      expect(reference.reminders.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("uses unique IDs and valid costs", () => {
    const allSpends = Object.values(symbolSpendReferences).flatMap((reference) => [...reference.positive, ...reference.negative]);
    expect(new Set(allSpends.map((spend) => spend.id)).size).toBe(allSpends.length);
    expect(allSpends.every((spend) => spend.cost.count >= 1 && spend.effect.length > 0)).toBe(true);
  });

  it("includes cross-rule combat and social options", () => {
    expect(symbolSpendReferences.combat.positive.some((spend) => spend.id === "combat-critical")).toBe(true);
    expect(symbolSpendReferences.combat.positive.some((spend) => spend.id === "combat-quality")).toBe(true);
    expect(symbolSpendReferences.combat.positive.some((spend) => spend.id === "combat-initiative-maneuver")).toBe(true);
    expect(symbolSpendReferences.social.positive.some((spend) => spend.id === "social-learn-motivation")).toBe(true);
    expect(symbolSpendReferences.social.negative.some((spend) => spend.id === "social-false-read")).toBe(true);
  });
});
