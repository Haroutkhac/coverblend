'use client';

import { motion } from 'motion/react';
import type { MatchResult } from '@/types/analysis';
import { MatchCard } from '@/components/matching/MatchCard';

interface MatchGridProps {
  matches: MatchResult[];
  onSelect: (match: MatchResult) => void;
  selectedId: string | null;
}

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
};

export function MatchGrid({ matches, onSelect, selectedId }: MatchGridProps) {
  if (matches.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-600 text-sm">
        No matches found. Upload a photo to discover matching album covers.
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      {matches.map((match) => (
        <motion.div key={match.album.id} variants={item}>
          <MatchCard
            match={match}
            isSelected={selectedId === match.album.id}
            onClick={() => onSelect(match)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
