'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { BlendSettings } from '@/types/blend';
import { DEFAULT_BLEND_SETTINGS } from '@/types/blend';
import { loadImage, getImageData, imageDataToCanvas, canvasToDataUrl } from '@/lib/image-analysis/canvas-utils';
import { compositeToCanvas } from '@/lib/blending/compositor';

const DEBOUNCE_MS = 150;

interface UseBlendEngineReturn {
  settings: BlendSettings;
  updateSettings: (partial: Partial<BlendSettings>) => void;
  compositeUrl: string | null;
  isRendering: boolean;
  reset: () => void;
}

export function useBlendEngine(
  photoUrl: string | null,
  coverUrl: string | null
): UseBlendEngineReturn {
  const [settings, setSettings] = useState<BlendSettings>(DEFAULT_BLEND_SETTINGS);
  const [compositeUrl, setCompositeUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renderGeneration = useRef(0);

  const updateSettings = useCallback((partial: Partial<BlendSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_BLEND_SETTINGS);
    setCompositeUrl(null);
    setIsRendering(false);
    renderGeneration.current += 1;
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
  }, []);

  useEffect(() => {
    if (!photoUrl || !coverUrl) {
      setCompositeUrl(null);
      return;
    }

    // Increment generation to invalidate stale renders
    renderGeneration.current += 1;
    const currentGeneration = renderGeneration.current;

    // Clear any pending debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Capture non-null values for the closure
    const currentPhotoUrl = photoUrl;
    const currentCoverUrl = coverUrl;

    debounceTimer.current = setTimeout(() => {
      async function render() {
        setIsRendering(true);

        try {
          const [photoImg, coverImg] = await Promise.all([
            loadImage(currentPhotoUrl),
            loadImage(currentCoverUrl),
          ]);

          // Bail out if a newer render has been scheduled
          if (currentGeneration !== renderGeneration.current) return;

          const photoData = getImageData(photoImg);
          const coverData = getImageData(coverImg);

          const photoCanvas = imageDataToCanvas(photoData);
          const coverCanvas = imageDataToCanvas(coverData);

          const resultCanvas = compositeToCanvas(photoCanvas, coverCanvas, settings);

          // Bail out if stale
          if (currentGeneration !== renderGeneration.current) return;

          const url = canvasToDataUrl(resultCanvas, 'image/png');
          setCompositeUrl(url);
        } catch {
          // Silently fail on stale renders; only clear for current
          if (currentGeneration === renderGeneration.current) {
            setCompositeUrl(null);
          }
        } finally {
          if (currentGeneration === renderGeneration.current) {
            setIsRendering(false);
          }
        }
      }

      render();
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [photoUrl, coverUrl, settings]);

  return { settings, updateSettings, compositeUrl, isRendering, reset };
}
