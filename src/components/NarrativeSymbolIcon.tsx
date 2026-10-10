import type { NarrativeSymbol } from "../data/symbolSpends";

export const narrativeSymbolGlyphs: Record<NarrativeSymbol, string> = {
  advantage: "a",
  triumph: "t",
  threat: "h",
  despair: "d"
};

const labels: Record<NarrativeSymbol, string> = {
  advantage: "Advantage",
  triumph: "Triumph",
  threat: "Threat",
  despair: "Despair"
};

export function NarrativeSymbolIcon({ symbol }: { symbol: NarrativeSymbol }) {
  return <span className={`narrative-symbol narrative-symbol--${symbol}`} role="img" aria-label={labels[symbol]}>{narrativeSymbolGlyphs[symbol]}</span>;
}
