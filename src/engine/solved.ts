import { Grid, PlayGrid } from './puzzleTypes';

/**
 * Exact match: every cell's filled-ness must equal the target.
 * playGrid uses 2 for marks (cognitive aids) — a mark is NOT a fill, so a
 * should-fill cell that is marked counts as incomplete.
 */
export function isSolved(playGrid: PlayGrid, targetGrid: Grid): boolean {
  for (let r = 0; r < targetGrid.length; r += 1) {
    for (let c = 0; c < targetGrid[r].length; c += 1) {
      const shouldFill = targetGrid[r][c] === 1;
      const isFilled = playGrid[r][c] === 1;
      if (shouldFill !== isFilled) return false;
    }
  }
  return true;
}
