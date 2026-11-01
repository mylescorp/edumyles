"use client";

import React, { useMemo } from "react";
import { useVirtualizedList } from "@/hooks/useVirtualizedList";
import { ChevronUp, ChevronDown } from "lucide-react";

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight = 50,
  containerHeight = 400,
  className = ""
}: VirtualizedListProps<T>) {
  const {
    visibleItems,
    totalHeight,
    scrollTop,
    scrollToItem,
    handleScroll,
    startIndex,
    endIndex
  } = useVirtualizedList({
    items,
    itemHeight,
    containerHeight,
    overscan: 5
  });

  return (
    <div className={`relative overflow-auto ${className}`}>
      <div
        className="relative"
        style={{ height: totalHeight }}
        onScroll={handleScroll}
      >
        <div
          className="absolute top-0 left-0 right-0"
          style={{ transform: `translateY(${startIndex * itemHeight}px)` }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
              className="border-b border-gray-200"
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
      
      {/* Scroll indicators */}
      {scrollTop > 50 && (
        <button
          className="fixed top-4 right-4 p-2 bg-card border border-gray-300 rounded shadow-lg z-10"
          onClick={() => scrollToItem(0)}
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      )}
      
      {scrollTop < totalHeight - containerHeight - 50 && (
        <button
          className="fixed bottom-4 right-4 p-2 bg-card border border-gray-300 rounded shadow-lg z-10"
          onClick={() => scrollToItem(items.length - 1)}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
