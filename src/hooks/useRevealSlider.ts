'use client';

import { useState, useCallback, useRef, type RefObject } from 'react';

interface SliderHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}

interface UseRevealSliderReturn {
  position: number;
  isDragging: boolean;
  handlers: SliderHandlers;
}

function clampPosition(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function useRevealSlider(
  containerRef: RefObject<HTMLDivElement | null>
): UseRevealSliderReturn {
  const [position, setPosition] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const draggingRef = useRef(false);

  const getPositionFromEvent = useCallback(
    (clientX: number): number => {
      const container = containerRef.current;
      if (!container) return 0.5;

      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      return clampPosition(x / rect.width);
    },
    [containerRef]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      draggingRef.current = true;
      setIsDragging(true);
      setPosition(getPositionFromEvent(e.clientX));
    },
    [getPositionFromEvent]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      setPosition(getPositionFromEvent(e.clientX));
    },
    [getPositionFromEvent]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      draggingRef.current = false;
      setIsDragging(false);
    },
    []
  );

  return {
    position,
    isDragging,
    handlers: { onPointerDown, onPointerMove, onPointerUp },
  };
}
