import { scoreDifficulty } from '@/engine/difficulty';
import { deriveClues } from '@/engine/clues';
import { Grid } from '@/engine/puzzleTypes';

const plus: Grid = [
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [1, 1, 1, 1, 1],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
];

describe('scoreDifficulty', () => {
  it('scores the symmetric plus (area 25, 9 filled) as Easy with the expected axes', () => {
    const { row, col } = deriveClues(plus);
    const s = scoreDifficulty(plus, row, col, true, 2);
    expect(s.size).toBeCloseTo(1.0, 5); // area 25 -> 1.0
    expect(s.density).toBeCloseTo(1.4, 5); // |0.36-0.5|*2*5
    expect(s.segmentLength).toBeCloseTo(4.2, 5); // avgRun 1.8 -> 6-1.8
    expect(s.asymmetry).toBeCloseTo(0, 5); // fully mirror-symmetric
    expect(s.solveDepth).toBeCloseTo(0.8, 5); // (2-1)*0.8
    expect(s.total).toBeCloseTo(7.4, 5);
    expect(s.tier).toBe('Easy');
  });

  it('scores solveDepth 5.0 and never below Hard-ish when the puzzle is not unique', () => {
    const { row, col } = deriveClues(plus);
    const s = scoreDifficulty(plus, row, col, false, 3);
    expect(s.solveDepth).toBe(5.0);
  });

  it('buckets tiers by grid area (rows*cols), not by total score', () => {
    // Near-empty square grids of each boundary size, one filled cell each.
    const sized = (n: number): Grid => {
      const g: Grid = Array.from({ length: n }, () => new Array(n).fill(0)) as Grid;
      g[0][0] = 1;
      return g;
    };
    const tierOf = (n: number): string => {
      const g = sized(n);
      const { row, col } = deriveClues(g);
      return scoreDifficulty(g, row, col, true, 2).tier;
    };
    expect(tierOf(8)).toBe('Easy'); // area 64 -> Easy
    expect(tierOf(12)).toBe('Medium'); // area 144 -> Medium
    expect(tierOf(13)).toBe('Hard'); // area 169 -> Hard
    expect(tierOf(18)).toBe('Hard'); // area 324 -> Hard
    expect(tierOf(19)).toBe('Expert'); // area 361 -> Expert
    expect(tierOf(25)).toBe('Expert'); // area 625 -> Expert
  });

  it('derives tier from size alone, independent of uniqueness/total', () => {
    // A 25x25 grid is Expert even when non-unique (which used to force Expert via total).
    const big: Grid = Array.from({ length: 25 }, () => new Array(25).fill(0)) as Grid;
    big[0][0] = 1;
    const { row: bigRow, col: bigCol } = deriveClues(big);
    const bigScore = scoreDifficulty(big, bigRow, bigCol, false, 2);
    expect(bigScore.tier).toBe('Expert');

    // A 5x5 grid stays Easy even when non-unique.
    const { row: plusRow, col: plusCol } = deriveClues(plus);
    const smallScore = scoreDifficulty(plus, plusRow, plusCol, false, 2);
    expect(smallScore.tier).toBe('Easy');
  });

  it('computes intermediate size scaling for mid-range areas', () => {
    // A 10x10 grid (area 100, between 25 and 625)
    const mid: Grid = Array.from({ length: 10 }, () => new Array(10).fill(0)) as Grid;
    mid[0][0] = 1;
    const { row, col } = deriveClues(mid);
    const s = scoreDifficulty(mid, row, col, true, 1);
    // size should be 1.0 + (4.0 * (100 - 25)) / 600 = 1.0 + (300 / 600) = 1.5
    expect(s.size).toBeCloseTo(1.5, 5);
  });

  it('scores puzzles with long run segments', () => {
    // A fully filled grid has very long average runs
    const full: Grid = [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
    ];
    const { row, col } = deriveClues(full);
    const s = scoreDifficulty(full, row, col, true, 1);
    // All rows have run 7, all cols have run 3, avgRun = (3*7 + 7*3) / 10 = 42/10 = 4.2
    // segmentLength = clamp(6 - 4.2, 0, 5) = 1.8
    expect(s.segmentLength).toBeCloseTo(1.8, 1);
  });

  it('handles empty grid (zero area)', () => {
    // An empty grid has area 0, triggering zero-division guards
    const empty: Grid = [];
    const { row, col } = deriveClues(empty);
    const s = scoreDifficulty(empty, row, col, true, 1);
    // With area = 0: cols = 0, filled = 0, fillRatio = 0, bestSymmetry = 0
    expect(s.size).toBeCloseTo(1.0, 5); // area 0 <= 25 -> 1.0
    expect(s.density).toBeCloseTo(5.0, 5); // fillRatio 0, deviation 1.0, density 5.0
    expect(s.segmentLength).toBeCloseTo(5.0, 5); // avgRun 0, segmentLength clamp(6, 0, 5) = 5
    expect(s.asymmetry).toBeCloseTo(0, 5); // bestSymmetry 0
    expect(s.solveDepth).toBeCloseTo(0, 5); // (1-1)*0.8 = 0
  });

  it('triggers avgRun >= 6 branch with fully filled square grid', () => {
    // A fully filled 6x6 grid: row runs [6, 6, 6, 6, 6, 6], col runs [6, 6, 6, 6, 6, 6]
    // allRuns = [6*6 + 6*6], avgRun = 72 / 12 = 6.0
    // This triggers the avgRun >= 6 ? 0 branch
    const filled6x6: Grid = Array.from({ length: 6 }, () => [1, 1, 1, 1, 1, 1]) as Grid;
    const { row, col } = deriveClues(filled6x6);
    const s = scoreDifficulty(filled6x6, row, col, true, 1);
    expect(s.segmentLength).toBe(0); // avgRun >= 6 triggers the 0 case
  });
});
