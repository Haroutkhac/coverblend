'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils/cn';

import { useAlbumCatalog } from '@/hooks/useAlbumCatalog';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import type { AlbumCover } from '@/types/album';

const GENRES = [
  'All',
  'Rock',
  'Electronic',
  'Hip-Hop',
  'Pop',
  'Jazz',
  'Classical',
  'R&B',
  'Ambient',
  'Folk',
];

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.1 },
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

export default function GalleryPage() {
  const { catalog, isLoading, error } = useAlbumCatalog();
  const [search, setSearch] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const [expandedAlbum, setExpandedAlbum] = useState<AlbumCover | null>(null);

  const filtered = useMemo(() => {
    let albums = catalog;

    if (activeGenre !== 'All') {
      albums = albums.filter(
        (a) => a.genre.toLowerCase() === activeGenre.toLowerCase()
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      albums = albums.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.artist.toLowerCase().includes(q)
      );
    }

    return albums;
  }, [catalog, search, activeGenre]);

  const handleClose = useCallback(() => {
    setExpandedAlbum(null);
  }, []);

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose-400 mb-4">{error}</p>
          <Button variant="secondary" size="md" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <div className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-3"
          >
            Album Gallery
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-zinc-500 max-w-xl mb-8"
          >
            Browse our collection of {catalog.length} album covers across multiple genres.
            Pick one and blend it with your photo.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-md mb-6"
          >
            <div className="relative">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by artist or album..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </motion.div>

          {/* Genre filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-2"
          >
            {GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => setActiveGenre(genre)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border',
                  activeGenre === genre
                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                )}
              >
                {genre}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <ProgressRing progress={50} size={48} />
            <p className="text-sm text-zinc-500">Loading album catalog...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-zinc-500">No albums match your search.</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setActiveGenre('All');
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-600 mb-6">
              Showing {filtered.length} of {catalog.length} albums
            </p>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              key={`${activeGenre}-${search}`}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            >
              {filtered.map((album) => (
                <motion.div key={album.id} variants={item}>
                  <div
                    onClick={() => setExpandedAlbum(album)}
                    className="group cursor-pointer"
                  >
                    <Card hoverable className="p-0 overflow-hidden">
                      {/* Cover image */}
                      <div className="relative aspect-square overflow-hidden bg-zinc-800">
                        <Image
                          src={album.imagePath}
                          alt={`${album.title} by ${album.artist}`}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                          onError={(e) => {
                            // Fallback: hide broken image, show gradient
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        {/* Fallback gradient using dominant color */}
                        <div
                          className="absolute inset-0 -z-10"
                          style={{
                            background: `linear-gradient(135deg, ${album.dominantColor}, #18181b)`,
                          }}
                        />
                        {/* Genre badge */}
                        <div className="absolute top-2 left-2">
                          <Badge className="text-[10px]">{album.genre}</Badge>
                        </div>
                      </div>
                      {/* Info */}
                      <div className="p-3">
                        <p
                          className="text-sm font-medium text-zinc-100 truncate"
                          title={album.title}
                        >
                          {album.title}
                        </p>
                        <p
                          className="text-xs text-zinc-500 truncate"
                          title={album.artist}
                        >
                          {album.artist}
                        </p>
                        <p className="text-xs text-zinc-600 mt-0.5">{album.year}</p>
                      </div>
                    </Card>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </div>

      {/* ===== EXPANDED MODAL ===== */}
      <AnimatePresence>
        {expandedAlbum && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-zinc-800/80 backdrop-blur-sm flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Album cover */}
              <div className="relative aspect-square w-full bg-zinc-800">
                <Image
                  src={expandedAlbum.imagePath}
                  alt={`${expandedAlbum.title} by ${expandedAlbum.artist}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 500px"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div
                  className="absolute inset-0 -z-10"
                  style={{
                    background: `linear-gradient(135deg, ${expandedAlbum.dominantColor}, #18181b)`,
                  }}
                />
              </div>

              {/* Info */}
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-zinc-100 mb-1">
                    {expandedAlbum.title}
                  </h2>
                  <p className="text-zinc-400">{expandedAlbum.artist}</p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge>{expandedAlbum.genre}</Badge>
                  <span className="text-sm text-zinc-500">{expandedAlbum.year}</span>
                </div>

                {/* Feature summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                    <p className="text-lg font-semibold text-zinc-100 tabular-nums">
                      {Math.round(expandedAlbum.features.brightness * 100)}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                      Brightness
                    </p>
                  </div>
                  <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                    <p className="text-lg font-semibold text-zinc-100 tabular-nums">
                      {Math.round(expandedAlbum.features.contrast * 100)}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                      Contrast
                    </p>
                  </div>
                  <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                    <p className="text-lg font-semibold text-zinc-100 tabular-nums">
                      {Math.round(expandedAlbum.features.saturation * 100)}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                      Saturation
                    </p>
                  </div>
                </div>

                {/* Color palette */}
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Dominant Colors
                  </p>
                  <div className="flex gap-1.5">
                    {expandedAlbum.features.colorPalette.slice(0, 8).map((lab, i) => {
                      // Quick LAB to approximate hex for display
                      const lightness = Math.round((lab.L / 100) * 255);
                      const r = Math.min(255, Math.max(0, lightness + Math.round(lab.a * 1.5)));
                      const g = Math.min(255, Math.max(0, lightness - Math.round(lab.a * 0.5) - Math.round(lab.b * 0.5)));
                      const b = Math.min(255, Math.max(0, lightness - Math.round(lab.b * 1.5)));
                      return (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-lg ring-1 ring-white/10"
                          style={{ backgroundColor: `rgb(${r},${g},${b})` }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* CTA */}
                <Link href={`/blend?cover=${expandedAlbum.id}`}>
                  <Button variant="primary" size="lg" className="w-full mt-2">
                    Use This Cover
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
