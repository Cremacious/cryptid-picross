import { isSolved, isLineComplete } from '@/engine/solved';
import type { Grid, PlayGrid, PlayCell, Cell } from '@/engine/puzzleTypes';

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

describe('isLineComplete', () => {
  const line: Cell[] = [1, 0, 1, 1, 0];

  it('is true when the filled cells exactly match the target line', () => {
    const play: PlayCell[] = [1, 0, 1, 1, 0];
    expect(isLineComplete(play, line)).toBe(true);
  });

  it('treats marks (2) on should-empty cells as fine', () => {
    const play: PlayCell[] = [1, 2, 1, 1, 2];
    expect(isLineComplete(play, line)).toBe(true);
  });

  it('is false when a should-fill cell is only marked, not filled', () => {
    const play: PlayCell[] = [1, 0, 2, 1, 0]; // index 2 should be filled
    expect(isLineComplete(play, line)).toBe(false);
  });

  it('is false when the right number of cells is filled but in the wrong place', () => {
    const play: PlayCell[] = [1, 1, 1, 0, 0]; // 3 filled (matches clue count) but wrong pattern
    expect(isLineComplete(play, line)).toBe(false);
  });

  it('is true for a correctly-empty line (all-zero target)', () => {
    expect(isLineComplete([0, 0, 0], [0, 0, 0])).toBe(true);
  });
});
