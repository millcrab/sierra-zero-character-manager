import { useRef, type TouchEventHandler } from "react";

export type SwipeDestination<T> = { kind: "tab"; tab: T } | { kind: "exit" } | null;

export function swipeDestination<T>(tabs: readonly T[], active: T, horizontalDistance: number): SwipeDestination<T> {
  const index = tabs.indexOf(active);
  if (index < 0 || horizontalDistance === 0) return null;
  if (horizontalDistance < 0) return index === 0 ? { kind: "exit" } : { kind: "tab", tab: tabs[index - 1] };
  return index === tabs.length - 1 ? null : { kind: "tab", tab: tabs[index + 1] };
}

function blocksDrawerSwipe(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest("button, input, select, textarea, a, summary, [role='dialog'], [data-swipe-ignore]"));
}

export function useSwipeTabs<T>(tabs: readonly T[], active: T, onSelect: (tab: T) => void, onExit: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart: TouchEventHandler<HTMLElement> = (event) => {
    if (event.touches.length !== 1 || blocksDrawerSwipe(event.target)) {
      start.current = null;
      return;
    }
    start.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };
  const onTouchEnd: TouchEventHandler<HTMLElement> = (event) => {
    const origin = start.current;
    start.current = null;
    if (!origin || event.changedTouches.length !== 1) return;
    const horizontal = event.changedTouches[0].clientX - origin.x;
    const vertical = event.changedTouches[0].clientY - origin.y;
    if (Math.abs(horizontal) < 60 || Math.abs(horizontal) < Math.abs(vertical) * 1.25) return;
    const destination = swipeDestination(tabs, active, horizontal);
    if (destination?.kind === "exit") onExit();
    if (destination?.kind === "tab") onSelect(destination.tab);
  };
  const onTouchCancel: TouchEventHandler<HTMLElement> = () => { start.current = null; };
  return { onTouchStart, onTouchEnd, onTouchCancel };
}
