'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils/cn';

interface BlendCanvasProps {
  compositeUrl: string | null;
  originalUrl: string | null;
  isRendering: boolean;
}

export function BlendCanvas({ compositeUrl, originalUrl, isRendering }: BlendCanvasProps) {
  const hasImage = compositeUrl || originalUrl;

  return (
    <div
      className={cn(
        'relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800',
        !hasImage && 'flex items-center justify-center'
      )}
    >
      {!hasImage && (
        <div className="text-center px-6">
          <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-3">
            <svg
              className="w-6 h-6 text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
          </div>
          <p className="text-sm text-zinc-600">
            Select a match to see the blend
          </p>
        </div>
      )}

      {/* Original photo fallback */}
      {originalUrl && !compositeUrl && !isRendering && (
        <Image
          src={originalUrl}
          alt="Original photo"
          fill
          className="object-cover"
          unoptimized
        />
      )}

      {/* Composite result */}
      <AnimatePresence mode="wait">
        {compositeUrl && (
          <motion.div
            key={compositeUrl}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Image
              src={compositeUrl}
              alt="Blended composite"
              fill
              className="object-cover"
              unoptimized
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rendering overlay */}
      <AnimatePresence>
        {isRendering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-3">
              <svg
                className="w-8 h-8 animate-spin text-violet-400"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-xs font-medium text-zinc-300">
                Rendering blend...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
