"use client";

import { useState, useEffect, useCallback } from "react";

interface TouchHandlers {
  onTouchStart?: (e: TouchEvent) => void;
  onTouchMove?: (e: TouchEvent) => void;
  onTouchEnd?: (e: TouchEvent) => void;
}

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  threshold?: number;
}

export function useMobileOptimizations() {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      setTouchStart({
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      });
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const deltaTime = Date.now() - touchStart.time;

    // Detect swipe gestures
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaTime < 500) {
      if (Math.abs(deltaX) > 50) {
        const direction = deltaX > 0 ? 'right' : 'left';
        // Trigger swipe event
        window.dispatchEvent(new CustomEvent('swipe', { detail: { direction } }));
      }
    }

    setTouchStart(null);
  }, [touchStart]);

  const useSwipeGesture = useCallback(
    (element: HTMLElement, onSwipe: (direction: string) => void, threshold = 50) => {
      let startX = 0;
      let startY = 0;

      const handleStart = (e: TouchEvent) => {
        const touch = e.touches[0];
        if (!touch) return;
        startX = touch.clientX;
        startY = touch.clientY;
      };

      const handleEnd = (e: TouchEvent) => {
        if (!startX || !startY) return;

        const touch = e.changedTouches[0];
        if (!touch) return;
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
          const direction = deltaX > 0 ? 'right' : 'left';
          onSwipe(direction);
        }
      };

      element.addEventListener('touchstart', handleStart, { passive: true });
      element.addEventListener('touchend', handleEnd, { passive: true });

      return () => {
        element.removeEventListener('touchstart', handleStart);
        element.removeEventListener('touchend', handleEnd);
      };
    },
    []
  );

  return {
    isMobile,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    },
    useSwipeGesture
  };
}
