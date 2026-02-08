import * as React from "react";
import { cn } from "@/lib/utils";

const ITEM_HEIGHT = 44; // px per item
const VISIBLE_COUNT = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;
const PADDING_ITEMS = Math.floor(VISIBLE_COUNT / 2); // 2 empty slots top & bottom

interface ScrollWheelColumnProps {
  items: number[];
  selectedValue: number;
  onSelect: (value: number) => void;
  formatItem: (v: number) => string;
  isFullscreen?: boolean;
}

export const ScrollWheelColumn = React.memo(({
  items,
  selectedValue,
  onSelect,
  formatItem,
  isFullscreen,
}: ScrollWheelColumnProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isUserScrolling = React.useRef(false);
  const scrollTimeout = React.useRef<ReturnType<typeof setTimeout>>();

  const selectedIndex = items.indexOf(selectedValue);

  // Scroll to selected item (centered) on mount and when value changes externally
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || isUserScrolling.current) return;
    const targetScroll = selectedIndex * ITEM_HEIGHT;
    el.scrollTo({ top: targetScroll, behavior: "auto" });
  }, [selectedIndex]);

  // Handle scroll end → snap to nearest item
  const handleScroll = React.useCallback(() => {
    isUserScrolling.current = true;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

    scrollTimeout.current = setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      const scrollTop = el.scrollTop;
      const nearestIndex = Math.round(scrollTop / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(nearestIndex, items.length - 1));

      // Snap scroll position
      el.scrollTo({ top: clampedIndex * ITEM_HEIGHT, behavior: "smooth" });

      if (items[clampedIndex] !== selectedValue) {
        onSelect(items[clampedIndex]);
      }
      isUserScrolling.current = false;
    }, 80);
  }, [items, selectedValue, onSelect]);

  // Click on a specific item to select it
  const handleItemClick = React.useCallback((item: number, index: number) => {
    const el = containerRef.current;
    if (el) {
      el.scrollTo({ top: index * ITEM_HEIGHT, behavior: "smooth" });
    }
    onSelect(item);
  }, [onSelect]);

  const itemFontSize = isFullscreen ? "text-2xl" : "text-lg";
  const columnWidth = isFullscreen ? "w-24" : "w-16";

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn(
        "relative overflow-y-auto scrollbar-hide snap-y snap-mandatory overscroll-contain",
        columnWidth
      )}
      style={{
        height: CONTAINER_HEIGHT,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Top padding */}
      {Array.from({ length: PADDING_ITEMS }).map((_, i) => (
        <div key={`top-pad-${i}`} style={{ height: ITEM_HEIGHT }} className="snap-center" />
      ))}

      {/* Actual items */}
      {items.map((item, index) => {
        const isSelected = item === selectedValue;
        return (
          <button
            key={item}
            onClick={() => handleItemClick(item, index)}
            className={cn(
              "w-full flex items-center justify-center font-semibold transition-all snap-center",
              itemFontSize,
              isSelected
                ? "bg-amber-400 text-black rounded-md scale-105"
                : isFullscreen
                  ? "text-white/60 hover:text-white"
                  : "text-muted-foreground hover:text-foreground"
            )}
            style={{ height: ITEM_HEIGHT }}
          >
            {formatItem(item)}
          </button>
        );
      })}

      {/* Bottom padding */}
      {Array.from({ length: PADDING_ITEMS }).map((_, i) => (
        <div key={`bot-pad-${i}`} style={{ height: ITEM_HEIGHT }} className="snap-center" />
      ))}
    </div>
  );
});

ScrollWheelColumn.displayName = "ScrollWheelColumn";
