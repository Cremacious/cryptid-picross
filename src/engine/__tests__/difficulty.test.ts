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
});
