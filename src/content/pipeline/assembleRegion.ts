import { Region } from '@/engine';
import { buildPuzzle, PuzzleInput } from '../buildPuzzle';

export interface RegionMeta {
  id: string;
  name: string;
  tagline: string;
  tint: string;
  isFree: boolean;
  iapProductId?: string;
}

/** Build a Region by deriving each puzzle from its authored grid via the engine. */
export function assembleRegion(meta: RegionMeta, puzzleInputs: PuzzleInput[]): Region {
  const puzzles = puzzleInputs.map(buildPuzzle);
  return { ...meta, puzzles, totalPuzzles: puzzles.length };
}

/** Surface content problems (never silently ship them). Returns human-readable warnings. */
export function validateRegion(region: Region): string[] {
  const warnings: string[] = [];
  const seen = new Set<string>();
  for (const p of region.puzzles) {
    if (seen.has(p.id)) warnings.push(`duplicate puzzle id: ${p.id}`);
    seen.add(p.id);
    if (p.requiresGuessing) warnings.push(`puzzle ${p.id} requires guessing (not uniquely solvable)`);
    if (!p.entry || !p.entry.body) warnings.push(`puzzle ${p.id} is missing a field entry`);
    const rows = p.grid.length;
    const cols = rows > 0 ? p.grid[0].length : 0;
    if (p.metadata.isCapstone && (rows !== 25 || cols !== 25)) {
      warnings.push(`capstone ${p.id} is ${rows}x${cols}, not 25x25`);
    }
  }
  return warnings;
}
