'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { MatchResult } from '@/types/analysis';
import { cn } from '@/lib/utils/cn';

interface MatchCardProps {
  match: MatchResult;
  isSelected: boolean;
  onClick: () => void;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-rose-400';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
  if (score >= 60) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-rose-500/10 border-rose-500/20';
}

function scoreBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-400';
  if (score >= 60) return 'bg-amber-400';
  return 'bg-rose-400';
}

export function MatchCard({ match, isSelected, onClick }: MatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const score = Math.round(match.overallScore * 100);

  const breakdown = [
    { label: 'Color', value: Math.round(match.colorScore * 100) },
    { label: 'Texture', value: Math.round(match.textureScore * 100) },
    { label: 'Luminance', value: Math.round(match.luminanceScore * 100) },
    { label: 'Brightness', value: Math.round(match.brightnessScore * 100) },
  ];

  return (
    <motion.div
      layout
      onClick={onClick}
      onHoverStart={() => setIsExpanded(true)}
      onHoverEnd={() => setIsExpanded(false)}
      className={cn(
        'group relative flex flex-col rounded-xl border bg-zinc-900 overflow-hidden cursor-pointer transition-colors',
        isSelected
          ? 'border-violet-500 ring-1 ring-violet-500/30'
          : 'border-zinc-800 hover:border-zinc-700'
      )}
    >
      {/* Album Cover */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-800">
        <Image
          src={match.album.imagePath}
          alt={`${match.album.title} by ${match.album.artist}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {/* Score badge overlay */}
        <div className="absolute top-2 right-2">
          <span
            className={cn(
              'inline-flex items-center px-2 py-1 rounded-md text-xs font-bold border tabular-nums',
              scoreBg(score),
              scoreColor(score)
            )}
          >
            {score}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-3">
        <p className="text-sm font-medium text-zinc-100 truncate" title={match.album.title}>
          {match.album.title}
        </p>
        <p className="text-xs text-zinc-500 truncate" title={match.album.artist}>
          {match.album.artist}
        </p>
      </div>

      {/* Score breakdown on hover/expand */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-zinc-800"
          >
            <div className="p-3 space-y-2">
              {breakdown.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 w-16 shrink-0">
                    {item.label}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className={cn('h-full rounded-full', scoreBarColor(item.value))}
                    />
                  </div>
                  <span className={cn('text-[10px] tabular-nums w-6 text-right', scoreColor(item.value))}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
