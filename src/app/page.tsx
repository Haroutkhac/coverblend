'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const STEPS = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
    title: 'Upload Your Photo',
    description: 'Drag and drop any photo or paste an image URL. We support JPEG, PNG, and WebP formats.',
    gradient: 'from-violet-500/20 to-purple-500/20',
    iconBg: 'bg-violet-500/15 border border-violet-500/20',
    accent: 'violet',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: 'AI Matches Album Covers',
    description: 'Our engine analyzes color palettes, textures, and luminance to find album covers that camouflage into your photo.',
    gradient: 'from-fuchsia-500/20 to-pink-500/20',
    iconBg: 'bg-fuchsia-500/15 border border-fuchsia-500/20',
    accent: 'fuchsia',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
      </svg>
    ),
    title: 'Blend & Share',
    description: 'Fine-tune the composite with blend modes, feathering, and color transfer. Download or share your creation.',
    gradient: 'from-purple-500/20 to-indigo-500/20',
    iconBg: 'bg-purple-500/15 border border-purple-500/20',
    accent: 'purple',
  },
];

const FEATURED_BLENDS = [
  {
    name: 'Sunset Skyline',
    album: 'A Rush of Blood to the Head',
    artist: 'Coldplay',
    gradientBefore: 'from-orange-500 via-rose-400 to-amber-300',
    gradientAfter: 'from-red-600 via-rose-500 to-orange-400',
  },
  {
    name: 'Ocean Depths',
    album: 'Kind of Blue',
    artist: 'Miles Davis',
    gradientBefore: 'from-cyan-500 via-blue-600 to-indigo-700',
    gradientAfter: 'from-blue-500 via-indigo-600 to-blue-800',
  },
  {
    name: 'Forest Walk',
    album: 'In Rainbows',
    artist: 'Radiohead',
    gradientBefore: 'from-emerald-400 via-green-500 to-teal-600',
    gradientAfter: 'from-green-500 via-emerald-500 to-teal-500',
  },
  {
    name: 'City Neon',
    album: 'After Hours',
    artist: 'The Weeknd',
    gradientBefore: 'from-fuchsia-500 via-pink-500 to-violet-600',
    gradientAfter: 'from-purple-500 via-fuchsia-500 to-pink-500',
  },
  {
    name: 'Desert Gold',
    album: 'Yeezus',
    artist: 'Kanye West',
    gradientBefore: 'from-amber-400 via-yellow-500 to-orange-500',
    gradientAfter: 'from-amber-500 via-orange-400 to-yellow-400',
  },
];

const STATS = [
  { label: 'Album Covers', value: '150+', icon: '💿' },
  { label: 'Genres', value: '7', icon: '🎵' },
  { label: 'Instant Results', value: '<1s', icon: '⚡' },
];

const EXAMPLE_THUMBNAILS = [
  { label: 'Sunset', gradient: 'from-orange-400 via-rose-500 to-purple-600' },
  { label: 'Ocean', gradient: 'from-cyan-400 via-blue-500 to-indigo-600' },
  { label: 'Neon', gradient: 'from-pink-500 via-fuchsia-500 to-violet-500' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[100vh] flex items-center justify-center px-4">
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(139,92,246,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(147,51,234,0.12) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(124,58,237,0.10) 0%, transparent 50%)',
          }}
        />
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, rgba(139,92,246,0.25) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(168,85,247,0.2) 0%, transparent 50%)',
            animation: 'pulse 8s ease-in-out infinite alternate',
          }}
        />

        {/* Animated dot pattern behind hero */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(139,92,246,0.8) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            animation: 'dotShift 20s linear infinite',
          }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        {/* Fade the gradient out at the bottom so it doesn't bleed into content */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#09090b] to-transparent -z-[5]" />

        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              AI-Powered Album Art Blending
            </div>
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[1.05] mb-8">
              <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-sm">
                Hide Music
              </span>
              <br />
              <span className="text-zinc-50">in Plain Sight</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="text-lg sm:text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Upload any photo. Discover the album cover that was hiding inside it all along.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          >
            <Link href="/blend">
              <Button variant="primary" size="lg">
                Try It Now
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="secondary" size="lg">
                See How It Works
              </Button>
            </Link>
          </motion.div>

          {/* Try an Example thumbnails */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="flex flex-col items-center gap-3"
          >
            <p className="text-sm text-zinc-500 font-medium uppercase tracking-wider">Or try an example</p>
            <div className="flex items-center gap-3">
              {EXAMPLE_THUMBNAILS.map((ex) => (
                <Link key={ex.label} href="/blend">
                  <motion.div
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative group cursor-pointer"
                  >
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br ${ex.gradient} shadow-lg shadow-black/30 ring-1 ring-white/10 group-hover:ring-white/25 transition-all`} />
                    <div className="absolute inset-0 rounded-xl bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <span className="text-[10px] sm:text-xs font-semibold text-white/80 group-hover:text-white transition-colors">{ex.label}</span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-6 h-10 rounded-full border-2 border-zinc-600 flex items-start justify-center p-1.5"
          >
            <motion.div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          </motion.div>
        </motion.div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="relative py-28 sm:py-36 px-4">
        {/* Subtle section background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-900/50 to-transparent -z-10" />
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <span className="inline-block text-sm font-semibold text-violet-400 uppercase tracking-widest mb-3">Process</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-zinc-50 mb-5">How It Works</h2>
            <p className="text-zinc-400 max-w-lg mx-auto text-lg">
              Three simple steps to create your own album cover camouflage
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          >
            {STEPS.map((step, index) => (
              <motion.div key={step.title} variants={fadeUp} transition={{ duration: 0.6 }}>
                <Card className="relative h-full text-center p-8 bg-zinc-900/80 border-zinc-700/50 backdrop-blur-sm hover:border-zinc-600/70 transition-colors">
                  {/* Subtle gradient glow at the top */}
                  <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${step.gradient} opacity-60`} />
                  {/* Step number */}
                  <div className="absolute top-4 right-4 text-xs font-bold text-zinc-600">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${step.iconBg} text-violet-400 mb-6`}>
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-50 mb-3">{step.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{step.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== LIVE BLEND EXAMPLE ===== */}
      <section className="relative py-28 sm:py-36 px-4">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent" />
        </div>
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span className="inline-block text-sm font-semibold text-fuchsia-400 uppercase tracking-widest mb-3">Example</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-zinc-50 mb-5">See It in Action</h2>
            <p className="text-zinc-400 max-w-lg mx-auto text-lg">
              Watch how a sunset photo seamlessly blends with album artwork
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative rounded-2xl border border-zinc-700/60 bg-zinc-900/70 backdrop-blur-sm overflow-hidden shadow-2xl shadow-violet-500/5">
              {/* Mock toolbar */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-700/50 bg-zinc-900/80">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-zinc-800 border border-zinc-700/50 text-xs text-zinc-500 font-mono">
                    coverblend.app/blend
                  </div>
                </div>
                <div className="w-12" />
              </div>

              {/* Mock blend UI */}
              <div className="p-6 sm:p-10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                  {/* Source photo */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center">Your Photo</p>
                    <div className="aspect-square rounded-xl bg-gradient-to-br from-orange-400 via-rose-400 to-purple-500 shadow-lg shadow-orange-500/20 ring-1 ring-white/10 relative overflow-hidden">
                      {/* Photo texture lines */}
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.15) 60%, transparent 60%)', backgroundSize: '8px 8px' }} />
                      <div className="absolute bottom-3 left-3 right-3 text-[10px] text-white/60 font-medium">sunset_photo.jpg</div>
                    </div>
                  </div>

                  {/* Blend indicator */}
                  <div className="flex flex-col items-center gap-3 py-4">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </motion.div>
                    <div className="flex items-center gap-2">
                      <div className="h-px w-8 bg-gradient-to-r from-transparent to-zinc-600" />
                      <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Blend</span>
                      <div className="h-px w-8 bg-gradient-to-l from-transparent to-zinc-600" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-zinc-500">Match Score</span>
                      <span className="text-lg font-bold text-emerald-400">94%</span>
                    </div>
                  </div>

                  {/* Result */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center">Blended Result</p>
                    <div className="aspect-square rounded-xl relative overflow-hidden shadow-lg shadow-fuchsia-500/15 ring-1 ring-white/10">
                      {/* Blended gradient - mix of both */}
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-rose-500 to-red-600" />
                      <div className="absolute inset-0 bg-gradient-to-tl from-violet-600/60 via-transparent to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-fuchsia-500/20 to-purple-600/40" />
                      {/* Album text overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-xs font-bold text-white/80 tracking-wide">A Rush of Blood</p>
                        <p className="text-[9px] text-white/50 mt-0.5">Coldplay</p>
                      </div>
                      {/* Shimmer animation */}
                      <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                        style={{ width: '30%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURED BLENDS ===== */}
      <section className="relative py-28 sm:py-36 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-900/40 to-transparent -z-10" />
        {/* Subtle side glow */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-96 h-96 bg-violet-600/5 blur-3xl rounded-full -z-10" />
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-96 h-96 bg-fuchsia-600/5 blur-3xl rounded-full -z-10" />

        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block text-sm font-semibold text-purple-400 uppercase tracking-widest mb-3">Gallery</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-zinc-50 mb-5">Featured Blends</h2>
            <p className="text-zinc-400 max-w-lg mx-auto text-lg">
              See what happens when everyday photos meet iconic album artwork
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5"
          >
            {FEATURED_BLENDS.map((blend) => (
              <motion.div key={blend.name} variants={fadeUp} transition={{ duration: 0.5 }}>
                <Card hoverable className="p-0 overflow-hidden group bg-zinc-900/80 border-zinc-700/50 hover:border-zinc-500/60">
                  {/* Before/After preview */}
                  <div className="relative aspect-square overflow-hidden">
                    {/* "After" layer (full) */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${blend.gradientAfter} brightness-110 saturate-110`} />
                    {/* "Before" layer (left half) */}
                    <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                      <div className={`w-[200%] h-full bg-gradient-to-br ${blend.gradientBefore} brightness-110 saturate-110`} />
                    </div>
                    {/* Divider */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/40" />
                    {/* Divider handle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 shadow-md flex items-center justify-center z-10">
                      <svg className="w-3.5 h-3.5 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                      </svg>
                    </div>
                    {/* Labels */}
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm">
                      <span className="text-[8px] font-semibold text-white/80 uppercase tracking-wider">Before</span>
                    </div>
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm">
                      <span className="text-[8px] font-semibold text-white/80 uppercase tracking-wider">After</span>
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                  <div className="p-3 bg-zinc-900/90 border-t border-zinc-800/50">
                    <p className="text-sm font-semibold text-zinc-100 truncate">{blend.name}</p>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      {blend.album} &middot; {blend.artist}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="relative py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-3 gap-4 sm:gap-8"
          >
            {STATS.map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="text-center p-6 sm:p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm hover:border-zinc-700/80 transition-colors"
              >
                <p className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-zinc-400 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== BOTTOM CTA ===== */}
      <section className="relative py-28 sm:py-36 px-4">
        {/* CTA background glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-600/8 blur-3xl rounded-full" />
        </div>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="p-10 sm:p-14 rounded-3xl bg-zinc-900/60 border border-zinc-700/50 backdrop-blur-sm relative overflow-hidden">
            {/* Gradient border accent at top */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-50 mb-5">
              Ready to Discover
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Your Blend?</span>
            </h2>
            <p className="text-zinc-400 mb-8 text-lg">
              Upload a photo and see which album cover has been hiding in it all along.
            </p>
            <Link href="/blend">
              <Button variant="primary" size="lg">
                Start Blending
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Background animation keyframes */}
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1) rotate(0deg); }
          100% { transform: scale(1.1) rotate(3deg); }
        }
        @keyframes dotShift {
          0% { background-position: 0 0; }
          100% { background-position: 32px 32px; }
        }
      `}</style>
    </div>
  );
}
