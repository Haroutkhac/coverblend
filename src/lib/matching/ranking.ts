import type { AlbumCover } from '@/types/album';
import type { AnalysisResult, MatchResult } from '@/types/analysis';
import { computeMatchScore } from '@/lib/matching/similarity';

const DEFAULT_TOP_K = 12;

export function findTopMatches(
  photo: AnalysisResult,
  catalog: AlbumCover[],
  topK: number = DEFAULT_TOP_K,
): MatchResult[] {
  const scored: MatchResult[] = catalog.map((album) => {
    const scores = computeMatchScore(photo, album.features);
    return { album, ...scores };
  });

  scored.sort((a, b) => b.overallScore - a.overallScore);

  return scored.slice(0, topK);
}

export function filterByGenre(matches: MatchResult[], genre: string): MatchResult[] {
  const lowerGenre = genre.toLowerCase();
  return matches.filter((m) => m.album.genre.toLowerCase() === lowerGenre);
}

export function filterByDecade(
  matches: MatchResult[],
  startYear: number,
  endYear: number,
): MatchResult[] {
  return matches.filter((m) => m.album.year >= startYear && m.album.year <= endYear);
}
