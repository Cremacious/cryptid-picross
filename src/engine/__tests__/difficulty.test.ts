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

  it('buckets tiers by total thresholds', () => {
    // A large near-empty grid pushes size, density, segment up.
    const big: Grid = Array.from({ length: 25 }, () => new Array(25).fill(0)) as Grid;
    big[0][0] = 1;
    const { row, col } = deriveClues(big);
    const s = scoreDifficulty(big, row, col, true, 2);
    expect(s.size).toBeCloseTo(5.0, 5); // area 625 -> 5.0
    expect(['Hard', 'Expert']).toContain(s.tier);
  });

  it('reaches Expert tier when puzzle is non-unique with large size', () => {
    // A large near-empty grid with non-unique solver pushes total >= 19
    const big: Grid = Array.from({ length: 25 }, () => new Array(25).fill(0)) as Grid;
    big[0][0] = 1;
    const { row, col } = deriveClues(big);
    const s = scoreDifficulty(big, row, col, false, 2);
    expect(s.tier).toBe('Expert');
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
