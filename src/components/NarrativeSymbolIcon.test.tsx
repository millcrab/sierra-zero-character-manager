import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NarrativeSymbolIcon, narrativeSymbolGlyphs } from "./NarrativeSymbolIcon";

describe("NarrativeSymbolIcon", () => {
  it("uses the Genesys font mappings for all four result symbols", () => {
    expect(narrativeSymbolGlyphs).toEqual({
      advantage: "a",
      triumph: "t",
      threat: "h",
      despair: "d"
    });
  });

  it("keeps an accessible symbol name", () => {
    expect(renderToStaticMarkup(<NarrativeSymbolIcon symbol="triumph" />)).toContain('aria-label="Triumph"');
  });
});
