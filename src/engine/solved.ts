import { Grid, PlayGrid, PlayCell, Cell } from './puzzleTypes';

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

/**
 * A single line (row or column) is complete when its filled cells exactly match the
 * target line: every should-fill cell is filled and no should-empty cell is filled.
 * Marks (2) are not fills, so a should-fill cell that is only marked is incomplete.
 * Wrong fills are possible mid-play, so a line matching its clue counts is NOT enough —
 * this is the per-line slice of isSolved, which drives the "clue crossed off" feedback.
 */
export function isLineComplete(playLine: PlayCell[], targetLine: Cell[]): boolean {
  if (playLine.length !== targetLine.length) return false;
  for (let i = 0; i < targetLine.length; i += 1) {
    if ((targetLine[i] === 1) !== (playLine[i] === 1)) return false;
  }
  return true;
}
