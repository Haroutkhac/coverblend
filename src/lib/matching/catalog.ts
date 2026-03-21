import type { AlbumCover, AlbumCatalog } from '@/types/album';

let cachedCatalog: AlbumCover[] | null = null;

export async function loadCatalog(): Promise<AlbumCover[]> {
  if (cachedCatalog) return cachedCatalog;

  const response = await fetch('/covers/index.json');

  if (!response.ok) {
    throw new Error(`Failed to load catalog: ${response.status} ${response.statusText}`);
  }

  const data: AlbumCatalog = await response.json();
  cachedCatalog = data.albums;

  return cachedCatalog;
}

export function getCatalog(): AlbumCover[] | null {
  return cachedCatalog;
}
