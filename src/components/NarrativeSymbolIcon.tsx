import type { NarrativeSymbol } from "../data/symbolSpends";

export const narrativeSymbolGlyphs: Record<NarrativeSymbol, string> = {
  advantage: "a",
  triumph: "t",
  threat: "h",
  despair: "d"
};

export const narrativeSymbolLabels: Record<NarrativeSymbol, string> = {
  advantage: "Advantage",
  triumph: "Triumph",
  threat: "Threat",
  despair: "Despair"
};

export function NarrativeSymbolIcon({ symbol, decorative = false }: { symbol: NarrativeSymbol; decorative?: boolean }) {
  return <span className={`narrative-symbol narrative-symbol--${symbol}`} role={decorative ? undefined : "img"} aria-label={decorative ? undefined : narrativeSymbolLabels[symbol]} aria-hidden={decorative || undefined}>{narrativeSymbolGlyphs[symbol]}</span>;
}
