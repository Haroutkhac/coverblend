'use client';

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  onUrlSelect: (url: string) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const EXAMPLE_PHOTOS = [
  {
    label: 'Sunset',
    gradient: 'from-orange-500 via-rose-500 to-purple-600',
    url: 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f97316"/><stop offset="50%" stop-color="#f43f5e"/><stop offset="100%" stop-color="#9333ea"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/></svg>'
    ),
  },
  {
    label: 'Ocean',
    gradient: 'from-cyan-400 via-blue-500 to-indigo-600',
    url: 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#22d3ee"/><stop offset="50%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#4f46e5"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/></svg>'
    ),
  },
  {
    label: 'Forest',
    gradient: 'from-emerald-400 via-green-600 to-teal-700',
    url: 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#34d399"/><stop offset="50%" stop-color="#16a34a"/><stop offset="100%" stop-color="#0f766e"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/></svg>'
    ),
  },
  {
    label: 'Dusk',
    gradient: 'from-pink-400 via-fuchsia-500 to-violet-600',
    url: 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f472b6"/><stop offset="50%" stop-color="#d946ef"/><stop offset="100%" stop-color="#7c3aed"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/></svg>'
    ),
  },
  {
    label: 'Warmth',
    gradient: 'from-amber-400 via-orange-500 to-red-600',
    url: 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fbbf24"/><stop offset="50%" stop-color="#f97316"/><stop offset="100%" stop-color="#dc2626"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/></svg>'
    ),
  },
];

export function DropZone({ onFileSelect, onUrlSelect, disabled = false }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file && ACCEPTED_TYPES.includes(file.type)) {
        onFileSelect(file);
      }
    },
    [disabled, onFileSelect]
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
      // Reset so the same file can be selected again
      e.target.value = '';
    },
    [onFileSelect]
  );

  const handleUrlSubmit = useCallback(() => {
    const trimmed = urlInput.trim();
    if (trimmed) {
      onUrlSelect(trimmed);
      setUrlInput('');
      setShowUrlInput(false);
    }
  }, [urlInput, onUrlSelect]);

  return (
    <div className="flex flex-col gap-6">
      {/* Drop area */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        animate={{
          borderColor: isDragOver ? '#8b5cf6' : '#3f3f46',
          backgroundColor: isDragOver ? 'rgba(139, 92, 246, 0.05)' : 'transparent',
        }}
        whileHover={disabled ? {} : { borderColor: '#71717a' }}
        transition={{ duration: 0.15 }}
        className={cn(
          'relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-colors',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Upload icon */}
        <motion.div
          animate={{ y: isDragOver ? -4 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex items-center justify-center w-14 h-14 rounded-xl bg-zinc-800/80 text-zinc-400"
        >
          <svg
            className="w-7 h-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </motion.div>

        <div className="text-center">
          <p className="text-sm font-medium text-zinc-200">
            Drop your photo here or{' '}
            <span className="text-violet-400">click to browse</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            JPEG, PNG, or WebP up to 10MB
          </p>
        </div>
      </motion.div>

      {/* URL input toggle */}
      <div className="flex items-center justify-center gap-3">
        <div className="h-px flex-1 bg-zinc-800" />
        <button
          type="button"
          onClick={() => setShowUrlInput((prev) => !prev)}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          disabled={disabled}
        >
          or paste an image URL
        </button>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      <AnimatePresence>
        {showUrlInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                placeholder="https://example.com/photo.jpg"
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                disabled={disabled}
              />
              <Button
                variant="secondary"
                size="md"
                onClick={handleUrlSubmit}
                disabled={disabled || !urlInput.trim()}
              >
                Load
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Example photos */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider text-center">
          Try an Example
        </p>
        <div className="flex justify-center gap-3">
          {EXAMPLE_PHOTOS.map((example) => (
            <motion.button
              key={example.label}
              type="button"
              onClick={() => !disabled && onUrlSelect(example.url)}
              disabled={disabled}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'group relative w-14 h-14 rounded-xl overflow-hidden',
                'ring-1 ring-zinc-700 hover:ring-violet-500 transition-all',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              title={example.label}
            >
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-br',
                  example.gradient
                )}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
                <span className="text-[10px] font-medium text-white">
                  {example.label}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
