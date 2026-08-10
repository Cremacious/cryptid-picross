import type { Grid, Line } from '@/engine/puzzleTypes';
import { lineClues, deriveClues } from '@/engine/clues';

describe('lineClues', () => {
  it('collapses runs of filled cells to lengths', () => {
    expect(lineClues([1, 1, 0, 1, 1, 1] as Line)).toEqual([2, 3]);
  });
  it('returns [0] for an empty line', () => {
    expect(lineClues([0, 0, 0, 0] as Line)).toEqual([0]);
  });
  it('handles a fully-filled line', () => {
    expect(lineClues([1, 1, 1] as Line)).toEqual([3]);
  });
  it('handles leading and trailing fills', () => {
    expect(lineClues([1, 0, 0, 1] as Line)).toEqual([1, 1]);
  });
});

describe('deriveClues', () => {
  it('derives row and column clues for a plus sign', () => {
    const grid: Grid = [
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
    ];
    const { row, col } = deriveClues(grid);
    expect(row).toEqual([[1], [1], [5], [1], [1]]);
    expect(col).toEqual([[1], [1], [5], [1], [1]]);
  });
  it('does not mutate the input grid', () => {
    const grid: Grid = [[1, 0], [0, 1]];
    const snapshot = JSON.stringify(grid);
    deriveClues(grid);
    expect(JSON.stringify(grid)).toBe(snapshot);
  });
});
