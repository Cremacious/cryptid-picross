import { isSolved } from '@/engine/solved';
import type { Grid, PlayGrid } from '@/engine/puzzleTypes';

const target: Grid = [
  [1, 0, 1],
  [0, 1, 0],
];

describe('isSolved', () => {
  it('is true when every filled cell matches exactly', () => {
    const play: PlayGrid = [
      [1, 0, 1],
      [0, 1, 0],
    ];
    expect(isSolved(play, target)).toBe(true);
  });

  it('treats marks (2) as non-fills — a mark on a should-fill cell is not solved', () => {
    const play: PlayGrid = [
      [2, 0, 1], // (0,0) should be filled but is marked
      [0, 1, 0],
    ];
    expect(isSolved(play, target)).toBe(false);
  });

  it('allows marks on should-be-empty cells (still solved)', () => {
    const play: PlayGrid = [
      [1, 2, 1], // (0,1) should be empty; a mark there is fine
      [0, 1, 0],
    ];
    expect(isSolved(play, target)).toBe(true);
  });

  it('is false when a cell that should be empty is filled', () => {
    const play: PlayGrid = [
      [1, 1, 1], // (0,1) filled but should be empty
      [0, 1, 0],
    ];
    expect(isSolved(play, target)).toBe(false);
  });
});
