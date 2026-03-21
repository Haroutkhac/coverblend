import Link from 'next/link';

const TECH_STACK = [
  {
    name: 'Next.js 14',
    description: 'React framework with App Router for server and client rendering',
  },
  {
    name: 'TypeScript',
    description: 'End-to-end type safety across the entire pipeline',
  },
  {
    name: 'Canvas API',
    description: 'Client-side pixel manipulation for analysis and compositing',
  },
  {
    name: 'Tailwind CSS',
    description: 'Utility-first styling with a custom dark design system',
  },
];

function StepSection({
  number,
  title,
  description,
  details,
  diagramColors,
}: {
  number: string;
  title: string;
  description: string;
  details: string[];
  diagramColors: string[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400 text-sm font-bold">
            {number}
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-zinc-100">{title}</h3>
        </div>
        <p className="text-zinc-400 leading-relaxed">{description}</p>
        <ul className="space-y-2">
          {details.map((detail) => (
            <li key={detail} className="flex items-start gap-2 text-sm text-zinc-500">
              <svg
                className="w-4 h-4 text-violet-500 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {detail}
            </li>
          ))}
        </ul>
      </div>

      {/* Visual diagram placeholder */}
      <div className="flex items-center justify-center">
        <div className="relative w-full max-w-sm aspect-square rounded-2xl border border-zinc-800 bg-zinc-900 p-6 overflow-hidden">
          {/* Abstract visual representation */}
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-2 p-6">
            {diagramColors.map((color, i) => (
              <div
                key={i}
                className="rounded-lg transition-all"
                style={{
                  backgroundColor: color,
                  opacity: 0.6 + (i % 3) * 0.15,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          {/* Label */}
          <div className="absolute bottom-4 left-4 right-4 text-center">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
              {title}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-100 mb-4">
            How{' '}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              CoverBlend
            </span>{' '}
            Works
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed">
            A deep dive into the algorithms and techniques that let us find album covers
            that camouflage seamlessly into your photos.
          </p>
        </div>
      </section>

      {/* ===== ALGORITHM STEPS ===== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-24 sm:space-y-32">
        {/* Step 1: Color Analysis */}
        <StepSection
          number="01"
          title="Color Analysis"
          description="We extract the dominant color palette from your photo using k-means clustering in CIELAB color space. LAB is perceptually uniform, meaning the mathematical distance between two colors matches how different they appear to the human eye."
          details={[
            'Image is downsampled to 200px for performance',
            'RGB pixels are converted to CIELAB color space',
            'K-means clustering (k=8) identifies dominant colors',
            'A 16-bin color histogram captures the full distribution',
            'Brightness and saturation are computed as aggregate stats',
          ]}
          diagramColors={[
            '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe',
            '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95',
            '#a855f7', '#9333ea', '#7e22ce', '#6b21a8',
            '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff',
          ]}
        />

        {/* Step 2: Texture Analysis */}
        <StepSection
          number="02"
          title="Texture Analysis"
          description="Gabor filters at multiple orientations and frequencies capture the textural character of an image. Whether it's the smooth gradients of a sunset or the fine grain of a concrete wall, texture matching ensures the album cover feels natural."
          details={[
            'Grayscale conversion preserves luminance information',
            'Gabor filters are applied at 4 orientations (0, 45, 90, 135 degrees)',
            'Two frequency bands capture coarse and fine textures',
            'Energy responses are normalized into an 8-element feature vector',
            'A 4x4 luminance grid captures spatial brightness distribution',
          ]}
          diagramColors={[
            '#18181b', '#27272a', '#3f3f46', '#52525b',
            '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7',
            '#3f3f46', '#52525b', '#71717a', '#a1a1aa',
            '#27272a', '#3f3f46', '#52525b', '#71717a',
          ]}
        />

        {/* Step 3: Matching */}
        <StepSection
          number="03"
          title="Matching"
          description="Every album in our catalog has been pre-analyzed with the same pipeline. We compute a weighted similarity score that combines color, texture, luminance, and brightness components using cosine similarity."
          details={[
            'Feature vectors are compared via cosine similarity',
            'Color score (40% weight): palette and histogram similarity',
            'Texture score (25% weight): Gabor energy pattern matching',
            'Luminance score (20% weight): spatial brightness structure',
            'Brightness/contrast (15% weight): overall tonal matching',
          ]}
          diagramColors={[
            '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5',
            '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7',
            '#f87171', '#fca5a5', '#fecaca', '#fee2e2',
            '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe',
          ]}
        />

        {/* Step 4: Blending */}
        <StepSection
          number="04"
          title="Blending"
          description="The selected album cover is composited into your photo using Reinhard color transfer and Gaussian feathering. This ensures the cover's colors adapt to the photo's palette and edges blend seamlessly."
          details={[
            'Reinhard color transfer shifts album colors to match the photo',
            'Gaussian feathering creates smooth, natural edge transitions',
            'Five blend modes: Normal, Multiply, Screen, Overlay, Soft Light',
            'Adjustable opacity, scale, position, and rotation',
            'Everything runs client-side on the Canvas API, no server uploads needed',
          ]}
          diagramColors={[
            '#8b5cf6', '#a78bfa', '#60a5fa', '#93c5fd',
            '#7c3aed', '#818cf8', '#6366f1', '#4f46e5',
            '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff',
            '#9333ea', '#a78bfa', '#c4b5fd', '#ddd6fe',
          ]}
        />
      </section>

      {/* ===== TECH STACK ===== */}
      <section className="border-t border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-3 text-center">
            Tech Stack
          </h2>
          <p className="text-zinc-500 text-center max-w-lg mx-auto mb-12">
            Built with modern web technologies for a fast, private, client-side experience
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TECH_STACK.map((tech) => (
              <div
                key={tech.name}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-2"
              >
                <h3 className="text-sm font-semibold text-zinc-100">{tech.name}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {tech.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRIVACY NOTE ===== */}
      <section className="border-t border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-5">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-100 mb-3">
            100% Client-Side Processing
          </h2>
          <p className="text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Your photos never leave your device. All analysis, matching, and blending happens
            entirely in your browser using the Canvas API. No server uploads, no data collection,
            no tracking.
          </p>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="border-t border-zinc-800 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-4">
            Try It Yourself
          </h2>
          <p className="text-zinc-500 max-w-lg mx-auto mb-8">
            Upload a photo and discover which album cover was hiding inside it all along.
          </p>
          <Link
            href="/blend"
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3 text-base font-medium rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow"
          >
            Start Blending
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
