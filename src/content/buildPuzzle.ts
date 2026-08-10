import {
  Grid,
  Puzzle,
  FieldEntry,
  PuzzleMetadata,
  deriveClues,
  analyzePuzzle,
  scoreDifficulty,
} from '@/engine';

export interface PuzzleInput {
  id: string;
  name: string;
  subtitle: string;
  grid: Grid;
  entry: FieldEntry;
  metadata: PuzzleMetadata;
}

/** Derive all engine-computed fields from an authored grid (runtime content-import). */
export function buildPuzzle(input: PuzzleInput): Puzzle {
  const { grid } = input;
  const { row, col } = deriveClues(grid);
  const { unique, depth } = analyzePuzzle(row, col);
  const difficulty = scoreDifficulty(grid, row, col, unique, depth);
  const area = grid.length * (grid[0]?.length ?? 0);
  let filled = 0;
  for (const line of grid) {
    for (const cell of line) {
      filled += cell;
    }
  }
  return {
    ...input,
    rowClues: row,
    colClues: col,
    fillRatio: area > 0 ? filled / area : 0,
    isUnique: unique,
    requiresGuessing: !unique,
    difficulty,
  };
}
