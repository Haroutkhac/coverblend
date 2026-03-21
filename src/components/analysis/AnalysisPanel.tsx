'use client';

import { motion } from 'motion/react';
import type { AnalysisResult } from '@/types/analysis';
import { cn } from '@/lib/utils/cn';

interface AnalysisPanelProps {
  result: AnalysisResult | null;
  isAnalyzing: boolean;
}

function labToRgb(L: number, a: number, b: number): string {
  // Approximate LAB to RGB conversion
  let y = (L + 16) / 116;
  let x = a / 500 + y;
  let z = y - b / 200;

  const cube = (v: number) => v * v * v;
  x = 0.95047 * (cube(x) > 0.008856 ? cube(x) : (x - 16 / 116) / 7.787);
  y = 1.0 * (cube(y) > 0.008856 ? cube(y) : (y - 16 / 116) / 7.787);
  z = 1.08883 * (cube(z) > 0.008856 ? cube(z) : (z - 16 / 116) / 7.787);

  const r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  const g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  const bVal = x * 0.0557 + y * -0.204 + z * 1.057;

  const toSrgb = (v: number) =>
    Math.max(0, Math.min(255, Math.round(255 * (v > 0.0031308 ? 1.055 * Math.pow(v, 1 / 2.4) - 0.055 : 12.92 * v))));

  return `rgb(${toSrgb(r)}, ${toSrgb(g)}, ${toSrgb(bVal)})`;
}

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded bg-zinc-800', className)} />
  );
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function AnalysisPanel({ result, isAnalyzing }: AnalysisPanelProps) {
  if (isAnalyzing) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <SkeletonPulse className="h-4 w-28" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonPulse key={i} className="w-10 h-10 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <SkeletonPulse className="h-4 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonPulse key={i} className="h-3 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonPulse key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center py-12 text-zinc-600 text-sm">
        Upload a photo to see its analysis
      </div>
    );
  }

  const { colorPalette, textureEnergy, luminanceGrid, brightness, contrast, saturation } = result;

  // Normalize texture energy for display (max bar width)
  const maxEnergy = Math.max(...textureEnergy, 0.001);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Color Palette */}
      <motion.div variants={fadeUp} className="space-y-2.5">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Color Palette
        </h3>
        <div className="flex gap-2">
          {colorPalette.slice(0, 8).map((lab, i) => {
            const color = labToRgb(lab.L, lab.a, lab.b);
            return (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 400, damping: 15 }}
                className="w-10 h-10 rounded-lg ring-1 ring-white/10 shadow-sm"
                style={{ backgroundColor: color }}
                title={`L:${lab.L.toFixed(0)} a:${lab.a.toFixed(0)} b:${lab.b.toFixed(0)}`}
              />
            );
          })}
        </div>
      </motion.div>

      {/* Texture Energy */}
      <motion.div variants={fadeUp} className="space-y-2.5">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Texture Energy
        </h3>
        <div className="space-y-1.5">
          {textureEnergy.slice(0, 6).map((energy, i) => {
            const width = (energy / maxEnergy) * 100;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 w-4 text-right tabular-nums">
                  {i + 1}
                </span>
                <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ delay: 0.2 + i * 0.06, duration: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                  />
                </div>
                <span className="text-[10px] text-zinc-500 w-10 tabular-nums">
                  {energy.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Luminance Grid */}
      <motion.div variants={fadeUp} className="space-y-2.5">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Luminance Grid
        </h3>
        <div className="inline-grid grid-cols-4 gap-1">
          {luminanceGrid.slice(0, 16).map((val, i) => {
            const normalized = Math.min(Math.max(val, 0), 1);
            const lightness = Math.round(normalized * 100);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.03 }}
                className="w-8 h-8 rounded-md"
                style={{
                  backgroundColor: `hsl(0, 0%, ${lightness}%)`,
                }}
                title={`${(val * 100).toFixed(0)}%`}
              />
            );
          })}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        {[
          { label: 'Brightness', value: brightness },
          { label: 'Contrast', value: contrast },
          { label: 'Saturation', value: saturation },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-1 rounded-lg bg-zinc-800/50 p-3"
          >
            <span className="text-lg font-semibold text-zinc-100 tabular-nums">
              {(stat.value * 100).toFixed(0)}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
