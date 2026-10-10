import { describe, expect, it } from "vitest";
import { swipeDestination } from "./useSwipeTabs";

const tabs = ["first", "second", "third"] as const;

describe("drawer swipe navigation", () => {
  it("moves left toward the previous tab and exits from the first", () => {
    expect(swipeDestination(tabs, "second", -80)).toEqual({ kind: "tab", tab: "first" });
    expect(swipeDestination(tabs, "first", -80)).toEqual({ kind: "exit" });
  });

  it("moves right toward the next tab and stops at the end", () => {
    expect(swipeDestination(tabs, "second", 80)).toEqual({ kind: "tab", tab: "third" });
    expect(swipeDestination(tabs, "third", 80)).toBeNull();
  });
});
