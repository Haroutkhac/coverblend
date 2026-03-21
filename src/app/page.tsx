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
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: 'AI Matches Album Covers',
    description: 'Our engine analyzes color palettes, textures, and luminance to find album covers that camouflage into your photo.',
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
  { label: 'Album Covers', value: '150+' },
  { label: 'Genres', value: '7' },
  { label: 'Instant Results', value: '\u26A1' },
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
              'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(139,92,246,0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(147,51,234,0.10) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(124,58,237,0.08) 0%, transparent 50%)',
          }}
        />
        <div
          className="absolute inset-0 -z-10 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, rgba(139,92,246,0.2) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(168,85,247,0.15) 0%, transparent 50%)',
            animation: 'pulse 8s ease-in-out infinite alternate',
          }}
        />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-6">
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Hide Music
              </span>
              <br />
              <span className="text-zinc-100">in Plain Sight</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Upload any photo. Discover the album cover that was hiding inside it all along.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
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
            className="w-6 h-10 rounded-full border-2 border-zinc-700 flex items-start justify-center p-1.5"
          >
            <motion.div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          </motion.div>
        </motion.div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-24 sm:py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">How It Works</h2>
            <p className="text-zinc-500 max-w-lg mx-auto">
              Three simple steps to create your own album cover camouflage
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {STEPS.map((step, index) => (
              <motion.div key={step.title} variants={fadeUp} transition={{ duration: 0.6 }}>
                <Card className="relative h-full text-center p-8">
                  {/* Step number */}
                  <div className="absolute top-4 right-4 text-xs font-bold text-zinc-700">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/10 text-violet-400 mb-5">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-100 mb-3">{step.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{step.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURED BLENDS ===== */}
      <section className="py-24 sm:py-32 px-4 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">Featured Blends</h2>
            <p className="text-zinc-500 max-w-lg mx-auto">
              See what happens when everyday photos meet iconic album artwork
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5"
          >
            {FEATURED_BLENDS.map((blend) => (
              <motion.div key={blend.name} variants={fadeUp} transition={{ duration: 0.5 }}>
                <Card hoverable className="p-0 overflow-hidden group">
                  {/* Before/After preview */}
                  <div className="relative aspect-square overflow-hidden">
                    {/* "After" layer (full) */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${blend.gradientAfter}`} />
                    {/* "Before" layer (left half) */}
                    <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                      <div className={`w-[200%] h-full bg-gradient-to-br ${blend.gradientBefore}`} />
                    </div>
                    {/* Divider */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/30" />
                    {/* Labels */}
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm">
                      <span className="text-[8px] font-medium text-white/70 uppercase tracking-wider">Before</span>
                    </div>
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm">
                      <span className="text-[8px] font-medium text-white/70 uppercase tracking-wider">After</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-zinc-100 truncate">{blend.name}</p>
                    <p className="text-xs text-zinc-500 truncate">
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
      <section className="py-20 px-4 border-t border-zinc-900">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="max-w-4xl mx-auto grid grid-cols-3 gap-8"
        >
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </p>
              <p className="text-sm text-zinc-500">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== BOTTOM CTA ===== */}
      <section className="py-24 sm:py-32 px-4 border-t border-zinc-900">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-4">
            Ready to Discover Your Blend?
          </h2>
          <p className="text-zinc-500 mb-8">
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
        </motion.div>
      </section>

      {/* Background animation keyframes */}
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1) rotate(0deg); }
          100% { transform: scale(1.1) rotate(3deg); }
        }
      `}</style>
    </div>
  );
}
