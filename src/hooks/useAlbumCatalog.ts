'use client';

import { useState, useEffect } from 'react';
import type { AlbumCover } from '@/types/album';
import { loadCatalog, getCatalog } from '@/lib/matching/catalog';

interface UseAlbumCatalogReturn {
  catalog: AlbumCover[];
  isLoading: boolean;
  error: string | null;
}

export function useAlbumCatalog(): UseAlbumCatalogReturn {
  const [catalog, setCatalog] = useState<AlbumCover[]>(() => getCatalog() ?? []);
  const [isLoading, setIsLoading] = useState(() => getCatalog() === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If catalog is already cached, no need to fetch
    const cached = getCatalog();
    if (cached) {
      setCatalog(cached);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchCatalog() {
      setIsLoading(true);
      setError(null);

      try {
        const albums = await loadCatalog();
        if (!cancelled) {
          setCatalog(albums);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Failed to load album catalog';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  return { catalog, isLoading, error };
}
