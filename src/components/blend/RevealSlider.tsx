'use client';

import { useState, useRef, useCallback, type PointerEvent } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils/cn';

interface RevealSliderProps {
  beforeUrl: string;
  afterUrl: string;
  className?: string;
}

export function RevealSlider({ beforeUrl, afterUrl, className }: RevealSliderProps) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setPosition(percent);
  }, []);

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    },
    [isDragging, updatePosition]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={cn(
        'relative w-full aspect-square rounded-2xl overflow-hidden cursor-ew-resize select-none touch-none',
        'border border-zinc-800',
        className
      )}
    >
      {/* After image (full background) */}
      <div className="absolute inset-0">
        <Image
          src={afterUrl}
          alt="After (composite)"
          fill
          className="object-cover pointer-events-none"
          unoptimized
          draggable={false}
        />
      </div>

      {/* Before image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <div className="relative w-full h-full" style={{ width: `${(100 / position) * 100}%` }}>
          <Image
            src={beforeUrl}
            alt="Before (original)"
            fill
            className="object-cover pointer-events-none"
            unoptimized
            draggable={false}
          />
        </div>
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 bg-white/80 shadow-[0_0_8px_rgba(0,0,0,0.5)]"
        style={{ left: `${position}%` }}
      />

      {/* Drag handle */}
      <motion.div
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        style={{ left: `${position}%` }}
        animate={{ scale: isDragging ? 1.15 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg',
            'border-2',
            isDragging ? 'border-violet-400' : 'border-white/50'
          )}
        >
          <svg
            className="w-5 h-5 text-zinc-800"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4" />
          </svg>
        </div>
      </motion.div>

      {/* Labels */}
      <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm">
        <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">
          Before
        </span>
      </div>
      <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm">
        <span className="text-[10px] font-medium text-white/80 uppercase tracking-wider">
          After
        </span>
      </div>
    </div>
  );
}
