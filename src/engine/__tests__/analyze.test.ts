import { analyzePuzzle } from '@/engine/analyze';
import { deriveClues } from '@/engine/clues';
import type { Grid } from '@/engine/puzzleTypes';

describe('analyzePuzzle', () => {
  it('marks a logically-solvable puzzle unique with a bounded depth', () => {
    const plus: Grid = [
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
    ];
    const { row, col } = deriveClues(plus);
    const result = analyzePuzzle(row, col);
    expect(result.unique).toBe(true);
    expect(result.depth).toBeGreaterThanOrEqual(1);
    expect(result.depth).toBeLessThanOrEqual(50);
  });

  it('marks an ambiguous puzzle non-unique (2x2 checkerboard has two solutions)', () => {
    // rowClues [1],[1]; colClues [1],[1] — solvable as this grid OR its inverse
    const result = analyzePuzzle([[1], [1]], [[1], [1]]);
    expect(result.unique).toBe(false);
  });

  it('solves a fully-filled grid at depth 1', () => {
    const result = analyzePuzzle([[3], [3], [3]], [[3], [3], [3]]);
    expect(result.unique).toBe(true);
    expect(result.depth).toBe(1);
  });

  it('reports non-unique when a clue cannot fit (contradiction: run of 6 in a 5-wide row)', () => {
    // row 0 wants a run of 6 in 5 columns -> zero candidates -> contradiction
    const result = analyzePuzzle([[6], [1], [1], [1], [1]], [[1], [1], [1], [1], [1]]);
    expect(result.unique).toBe(false);
    expect(result.depth).toBe(1);
  });
});
