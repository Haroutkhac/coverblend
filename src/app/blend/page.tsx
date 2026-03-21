'use client';

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils/cn';

import { DropZone } from '@/components/upload/DropZone';
import { AnalysisPanel } from '@/components/analysis/AnalysisPanel';
import { MatchGrid } from '@/components/matching/MatchGrid';
import { BlendCanvas } from '@/components/blend/BlendCanvas';
import { BlendControls } from '@/components/blend/BlendControls';
import { RevealSlider } from '@/components/blend/RevealSlider';
import { ExportPanel } from '@/components/export/ExportPanel';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';

import { useImageAnalysis } from '@/hooks/useImageAnalysis';
import { useAlbumCatalog } from '@/hooks/useAlbumCatalog';
import { useBlendEngine } from '@/hooks/useBlendEngine';

import { findTopMatches } from '@/lib/matching/ranking';
import type { MatchResult } from '@/types/analysis';

type Step = 'upload' | 'analyze' | 'match' | 'blend';
const STEPS: { key: Step; label: string; number: number }[] = [
  { key: 'upload', label: 'Upload', number: 1 },
  { key: 'analyze', label: 'Analyze', number: 2 },
  { key: 'match', label: 'Match', number: 3 },
  { key: 'blend', label: 'Blend', number: 4 },
];

function stepIndex(step: Step): number {
  return STEPS.findIndex((s) => s.key === step);
}

function BlendPageContent() {
  const searchParams = useSearchParams();
  const preSelectedCoverId = searchParams.get('cover');

  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  const { analyze, analyzeFromUrl, result, imageUrl, isAnalyzing, error, reset: resetAnalysis } = useImageAnalysis();
  const { catalog, isLoading: isCatalogLoading } = useAlbumCatalog();
  const {
    settings,
    updateSettings,
    compositeUrl,
    isRendering,
    reset: resetBlend,
  } = useBlendEngine(imageUrl, selectedMatch?.album.imagePath ?? null);

  // Compute matches when result and catalog are ready
  const matches = useMemo(() => {
    if (!result || catalog.length === 0) return [];
    return findTopMatches(result, catalog);
  }, [result, catalog]);

  // Handle file upload
  const handleFileSelect = useCallback(
    (file: File) => {
      analyze(file);
      setCurrentStep('analyze');
    },
    [analyze]
  );

  // Handle URL upload
  const handleUrlSelect = useCallback(
    (url: string) => {
      analyzeFromUrl(url);
      setCurrentStep('analyze');
    },
    [analyzeFromUrl]
  );

  // Fake progress animation during analysis
  useEffect(() => {
    if (!isAnalyzing) {
      if (result) setAnalyzeProgress(100);
      return;
    }
    setAnalyzeProgress(0);
    const interval = setInterval(() => {
      setAnalyzeProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [isAnalyzing, result]);

  // Auto-advance from analyze to match when analysis completes
  useEffect(() => {
    if (currentStep === 'analyze' && result && !isAnalyzing) {
      const timer = setTimeout(() => {
        setCurrentStep('match');
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currentStep, result, isAnalyzing]);

  // Handle pre-selected cover from query param
  useEffect(() => {
    if (preSelectedCoverId && matches.length > 0 && currentStep === 'match') {
      const found = matches.find((m) => m.album.id === preSelectedCoverId);
      if (found) {
        setSelectedMatch(found);
        setCurrentStep('blend');
      }
    }
  }, [preSelectedCoverId, matches, currentStep]);

  // Handle match selection
  const handleMatchSelect = useCallback((match: MatchResult) => {
    setSelectedMatch(match);
    setCurrentStep('blend');
  }, []);

  // Go back one step
  const handleBack = useCallback(() => {
    const idx = stepIndex(currentStep);
    if (idx > 0) {
      const prevStep = STEPS[idx - 1].key;
      if (prevStep === 'upload') {
        resetAnalysis();
        resetBlend();
        setSelectedMatch(null);
        setAnalyzeProgress(0);
      } else if (prevStep === 'match') {
        resetBlend();
        setSelectedMatch(null);
      }
      setCurrentStep(prevStep);
    }
  }, [currentStep, resetAnalysis, resetBlend]);

  // Start over
  const handleStartOver = useCallback(() => {
    resetAnalysis();
    resetBlend();
    setSelectedMatch(null);
    setCurrentStep('upload');
    setAnalyzeProgress(0);
  }, [resetAnalysis, resetBlend]);

  const currentIdx = stepIndex(currentStep);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* ===== STEPPER ===== */}
      <div className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Step indicators */}
            <div className="flex items-center gap-2 sm:gap-4">
              {STEPS.map((step, i) => {
                const isActive = step.key === currentStep;
                const isCompleted = i < currentIdx;
                return (
                  <div key={step.key} className="flex items-center gap-2 sm:gap-4">
                    {i > 0 && (
                      <div
                        className={cn(
                          'hidden sm:block w-8 lg:w-12 h-px',
                          isCompleted ? 'bg-violet-500' : 'bg-zinc-800'
                        )}
                      />
                    )}
                    <button
                      onClick={() => {
                        if (isCompleted) {
                          if (step.key === 'upload') handleStartOver();
                          else setCurrentStep(step.key);
                        }
                      }}
                      disabled={!isCompleted && !isActive}
                      className={cn(
                        'flex items-center gap-2 transition-colors',
                        isActive && 'text-zinc-100',
                        isCompleted && 'text-violet-400 cursor-pointer hover:text-violet-300',
                        !isActive && !isCompleted && 'text-zinc-600 cursor-not-allowed'
                      )}
                    >
                      <span
                        className={cn(
                          'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border transition-colors',
                          isActive && 'border-violet-500 bg-violet-500/20 text-violet-300',
                          isCompleted && 'border-violet-500 bg-violet-500 text-white',
                          !isActive && !isCompleted && 'border-zinc-700 text-zinc-600'
                        )}
                      >
                        {isCompleted ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          step.number
                        )}
                      </span>
                      <span className="hidden sm:inline text-sm font-medium">{step.label}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {currentIdx > 0 && (
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                  Back
                </Button>
              )}
              {currentIdx > 0 && (
                <Button variant="ghost" size="sm" onClick={handleStartOver}>
                  Start Over
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* ===== STEP 1: UPLOAD ===== */}
          {currentStep === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl mx-auto"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">
                  Upload Your Photo
                </h1>
                <p className="text-zinc-500 text-sm">
                  Choose a photo to discover the album cover hiding inside it
                </p>
              </div>
              <DropZone
                onFileSelect={handleFileSelect}
                onUrlSelect={handleUrlSelect}
                disabled={false}
              />
            </motion.div>
          )}

          {/* ===== STEP 2: ANALYZE ===== */}
          {currentStep === 'analyze' && (
            <motion.div
              key="analyze"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image preview */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-zinc-100">Your Photo</h2>
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
                    {imageUrl && (
                      <Image
                        src={imageUrl}
                        alt="Uploaded photo"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                    {isAnalyzing && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/60 backdrop-blur-sm gap-4">
                        <ProgressRing progress={analyzeProgress} size={64} strokeWidth={5} />
                        <p className="text-sm font-medium text-zinc-300">
                          Analyzing your photo...
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Analysis panel */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-zinc-100">Analysis</h2>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                    <AnalysisPanel result={result} isAnalyzing={isAnalyzing} />
                  </div>

                  {error && (
                    <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4">
                      <p className="text-sm text-rose-400">{error}</p>
                      <Button variant="ghost" size="sm" onClick={handleStartOver} className="mt-2">
                        Try Again
                      </Button>
                    </div>
                  )}

                  {result && !isAnalyzing && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => setCurrentStep('match')}
                        className="w-full"
                      >
                        Find Matching Covers
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== STEP 3: MATCH ===== */}
          {currentStep === 'match' && (
            <motion.div
              key="match"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">
                  Choose a Match
                </h1>
                <p className="text-zinc-500 text-sm">
                  We found {matches.length} album covers that match your photo&apos;s visual profile.
                  Click one to start blending.
                </p>
              </div>

              {isCatalogLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <ProgressRing progress={50} size={48} />
                  <p className="text-sm text-zinc-500">Loading album catalog...</p>
                </div>
              ) : (
                <MatchGrid
                  matches={matches}
                  onSelect={handleMatchSelect}
                  selectedId={selectedMatch?.album.id ?? null}
                />
              )}
            </motion.div>
          )}

          {/* ===== STEP 4: BLEND ===== */}
          {currentStep === 'blend' && (
            <motion.div
              key="blend"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-1">
                  Blend & Export
                </h1>
                {selectedMatch && (
                  <p className="text-zinc-500 text-sm">
                    Blending with{' '}
                    <span className="text-zinc-300 font-medium">{selectedMatch.album.title}</span>
                    {' '}by {selectedMatch.album.artist}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                {/* Main area */}
                <div className="space-y-6">
                  {/* Blend Canvas */}
                  <BlendCanvas
                    compositeUrl={compositeUrl}
                    originalUrl={imageUrl}
                    isRendering={isRendering}
                  />

                  {/* Reveal Slider */}
                  {compositeUrl && imageUrl && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-zinc-300">Before / After</h3>
                      <RevealSlider beforeUrl={imageUrl} afterUrl={compositeUrl} />
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Blend Controls */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                    <BlendControls settings={settings} onChange={updateSettings} />
                  </div>

                  {/* Export Panel */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                    <ExportPanel
                      compositeUrl={compositeUrl}
                      albumInfo={
                        selectedMatch
                          ? { title: selectedMatch.album.title, artist: selectedMatch.album.artist }
                          : null
                      }
                    />
                  </div>

                  {/* Try another match */}
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full"
                    onClick={() => {
                      resetBlend();
                      setSelectedMatch(null);
                      setCurrentStep('match');
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                    </svg>
                    Try Another Match
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function BlendPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <ProgressRing progress={30} size={48} />
            <p className="text-sm text-zinc-500">Loading...</p>
          </div>
        </div>
      }
    >
      <BlendPageContent />
    </Suspense>
  );
}
