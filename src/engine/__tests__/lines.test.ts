import { possibleLines, intersectLines } from '@/engine/lines';
import type { Line } from '@/engine/puzzleTypes';

describe('possibleLines', () => {
  it('places a single run in every position', () => {
    expect(possibleLines([1], 3)).toEqual([
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]);
  });
  it('returns the all-empty line for clue [0]', () => {
    expect(possibleLines([0], 5)).toEqual([[0, 0, 0, 0, 0]]);
  });
  it('fills the line exactly when the run equals the length', () => {
    expect(possibleLines([5], 5)).toEqual([[1, 1, 1, 1, 1]]);
  });
  it('respects the mandatory gap between runs', () => {
    expect(possibleLines([1, 1], 3)).toEqual([[1, 0, 1]]);
  });
  it('enumerates all arrangements of [2,3] in length 10', () => {
    const lines = possibleLines([2, 3], 10);
    // choose gaps g0>=0,g1>=1,g2>=0 with g0+g1+g2 = 10-5 = 5, g1>=1 -> 4 free split 3 ways = C(4+2,2)=15
    expect(lines.length).toBe(15);
    lines.forEach((l) => {
      expect(l.length).toBe(10);
      expect(l.reduce((a, b) => a + b, 0 as number) as number).toBe(5); // 2 + 3 filled cells
    });
  });
});

describe('intersectLines', () => {
  it('returns 1 where all candidates agree filled, 0 where all agree empty, null otherwise', () => {
    expect(intersectLines([
      [1, 0, 1],
      [1, 1, 0],
    ] as Line[])).toEqual([1, null, null]);
  });
  it('returns an empty array for no candidates', () => {
    expect(intersectLines([])).toEqual([]);
  });
  it('returns the line itself for a single candidate', () => {
    expect(intersectLines([[1, 0, 1]] as Line[])).toEqual([1, 0, 1]);
  });
});
