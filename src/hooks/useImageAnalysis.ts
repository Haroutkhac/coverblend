'use client';

import { useState, useCallback } from 'react';
import type { AnalysisResult } from '@/types/analysis';
import { extractFeatureVector } from '@/lib/image-analysis/feature-vector';
import {
  loadFileAsDataUrl,
  loadImage,
  getImageData,
} from '@/lib/image-analysis/canvas-utils';

const ANALYSIS_MAX_SIZE = 200;

interface UseImageAnalysisReturn {
  analyze: (file: File) => Promise<void>;
  analyzeFromUrl: (url: string) => Promise<void>;
  result: AnalysisResult | null;
  imageUrl: string | null;
  isAnalyzing: boolean;
  error: string | null;
  reset: () => void;
}

export function useImageAnalysis(): UseImageAnalysisReturn {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(async (dataUrl: string) => {
    const img = await loadImage(dataUrl);
    const imageData = getImageData(img, ANALYSIS_MAX_SIZE);
    const analysisResult = extractFeatureVector(imageData);

    setResult(analysisResult);
    setImageUrl(dataUrl);
  }, []);

  const analyze = useCallback(
    async (file: File) => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const dataUrl = await loadFileAsDataUrl(file);
        await processImage(dataUrl);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to analyze image';
        setError(message);
        setResult(null);
        setImageUrl(null);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [processImage]
  );

  const analyzeFromUrl = useCallback(
    async (url: string) => {
      setIsAnalyzing(true);
      setError(null);

      try {
        await processImage(url);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to analyze image';
        setError(message);
        setResult(null);
        setImageUrl(null);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [processImage]
  );

  const reset = useCallback(() => {
    setResult(null);
    setImageUrl(null);
    setIsAnalyzing(false);
    setError(null);
  }, []);

  return { analyze, analyzeFromUrl, result, imageUrl, isAnalyzing, error, reset };
}
