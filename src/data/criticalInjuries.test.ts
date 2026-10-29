import { describe, expect, it } from "vitest";
import { criticalInjuries, findCriticalInjury } from "./criticalInjuries";

describe("Critical Injury reference", () => {
  it("contains every Core Rulebook result exactly once", () => {
    expect(criticalInjuries).toHaveLength(29);
    expect(new Set(criticalInjuries.map((injury) => injury.id))).toHaveLength(29);
    expect(criticalInjuries[0]).toMatchObject({ roll: "01–05", name: "Minor Nick", severity: "Easy" });
    expect(criticalInjuries.at(-1)).toMatchObject({ roll: "151+", name: "Dead", severity: "—" });
  });

  it("looks up persistent injuries for saved character records", () => {
    expect(findCriticalInjury("bleeding-out")).toMatchObject({ severity: "Daunting" });
    expect(findCriticalInjury("not-real")).toBeUndefined();
  });
});
