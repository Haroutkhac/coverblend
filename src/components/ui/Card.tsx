'use client';

import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function Card({ children, className, hoverable = false }: CardProps) {
  const Comp = hoverable ? motion.div : 'div';

  const hoverProps = hoverable
    ? {
        whileHover: { y: -2, boxShadow: '0 8px 30px rgba(139, 92, 246, 0.08)' },
        transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
      }
    : {};

  return (
    <Comp
      className={cn(
        'rounded-xl border border-zinc-800 bg-zinc-900 p-5',
        hoverable && 'cursor-pointer transition-colors hover:border-zinc-700',
        className
      )}
      {...hoverProps}
    >
      {children}
    </Comp>
  );
}
