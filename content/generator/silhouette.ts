/**
 * Shared grid helpers used by the art-library assembler (`assembleRegion.ts`): a seeded
 * RNG for deterministic shuffles, ASCII<->Grid conversion, and the run-length guard that
 * keeps analyzePuzzle fast even at 25x25.
 *
 * Pure + seeded (mulberry32): a given seed always yields the same output, so builds are
 * reproducible and tweaking one puzzle never reshuffles the others.
 */

export type Grid = number[][];
export type RNG = () => number;

export function mulberry32(seed: number): RNG {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function maxRunsPerLine(grid: Grid): number {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  const runsIn = (cells: number[]): number => {
    let runs = 0;
    let prev = 0;
    for (const v of cells) {
      if (v === 1 && prev === 0) runs += 1;
      prev = v;
    }
    return runs;
  };
  let m = 0;
  for (let r = 0; r < rows; r += 1) m = Math.max(m, runsIn(grid[r]));
  for (let c = 0; c < cols; c += 1) m = Math.max(m, runsIn(grid.map((row) => row[c])));
  return m;
}

export const asciiToGrid = (rows: string[]): Grid => rows.map((r) => r.split('').map((c) => (c === '#' ? 1 : 0)));
