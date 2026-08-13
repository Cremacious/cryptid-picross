/**
 * Procedural silhouette generator. Grows a single connected "specimen" blob, then can
 * drift it off-axis (asymmetry) and hollow it (short runs) — the two levers the engine's
 * difficulty scorer rewards. Every row/column keeps few runs so analyzePuzzle stays fast
 * even at 25x25.
 *
 * Pure + seeded (mulberry32): a given seed always yields the same grid, so builds are
 * reproducible and tweaking one puzzle never reshuffles the others.
 *
 * Calibrated tiers (engine-scored, must be line-solvable = "unique"):
 *   Easy   small compact symmetric        (<8)
 *   Medium mid-size, mild drift           (8..14)
 *   Hard   larger, drift + roughen        (14..19)
 *   Expert 25x25, drift + roughen         (>=19, only reachable at max size)
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

const zeros = (rows: number, cols: number): Grid =>
  Array.from({ length: rows }, () => new Array<number>(cols).fill(0));

/**
 * Grow a connected blob to `targetFill` from one or more seeds, biased toward
 * (driftX, driftY). Multiple spread seeds make large shapes span the canvas instead of
 * balling up in a corner; they merge as they grow into one mass.
 */
function growBlob(rows: number, cols: number, targetFill: number, rng: RNG, driftX: number, driftY: number, seeds: number): Grid {
  const grid = zeros(rows, cols);
  const target = Math.max(2, Math.round(rows * cols * targetFill));
  const inBounds = (r: number, c: number) => r >= 0 && r < rows && c >= 0 && c < cols;
  const frontier: Array<[number, number]> = [];
  const addFrontier = (r: number, c: number) => {
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc) && grid[nr][nc] === 0) frontier.push([nr, nc]);
    }
  };

  // Seed positions: 1 at center, or K jittered across an inner margin of the canvas.
  const margin = 0.18;
  let filled = 0;
  const placeSeed = (r: number, c: number) => {
    const rr = Math.max(0, Math.min(rows - 1, r));
    const cc = Math.max(0, Math.min(cols - 1, c));
    if (grid[rr][cc] === 0) {
      grid[rr][cc] = 1;
      filled += 1;
      addFrontier(rr, cc);
    }
  };
  if (seeds <= 1) {
    placeSeed(Math.floor(rows / 2), Math.floor(cols / 2));
  } else {
    for (let s = 0; s < seeds; s += 1) {
      const r = Math.round((margin + rng() * (1 - 2 * margin)) * (rows - 1));
      const c = Math.round((margin + rng() * (1 - 2 * margin)) * (cols - 1));
      placeSeed(r, c);
    }
  }

  while (filled < target && frontier.length > 0) {
    // Sample a few frontier cells; prefer the one furthest along the drift vector, so the
    // shape grows lopsided (asymmetry) instead of a centered disc.
    let bestI = 0;
    let bestScore = -Infinity;
    const sample = Math.min(frontier.length, 10);
    for (let s = 0; s < sample; s += 1) {
      const i = Math.floor(rng() * frontier.length);
      const [fr, fc] = frontier[i];
      const score = (fc - cols / 2) * driftX + (fr - rows / 2) * driftY + rng() * 3;
      if (score > bestScore) {
        bestScore = score;
        bestI = i;
      }
    }
    const [r, c] = frontier.splice(bestI, 1)[0];
    if (grid[r][c] === 1) continue;
    grid[r][c] = 1;
    filled += 1;
    addFrontier(r, c);
  }
  return grid;
}

/** Hollow out interior cells (>=2 filled neighbors) to create gaps -> shorter runs. */
function roughen(grid: Grid, rng: RNG, amount: number): Grid {
  if (amount <= 0) return grid;
  const rows = grid.length;
  const cols = grid[0].length;
  const out = grid.map((row) => row.slice());
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (grid[r][c] !== 1) continue;
      let n = 0;
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
        const a = r + dr;
        const b = c + dc;
        if (a >= 0 && a < rows && b >= 0 && b < cols && grid[a][b] === 1) n += 1;
      }
      if (n >= 2 && rng() < amount) out[r][c] = 0;
    }
  }
  return out;
}

/** Translate the filled bounding box to the center of the grid (fixes corner-heavy drift). */
function recenter(grid: Grid): Grid {
  const rows = grid.length;
  const cols = grid[0].length;
  let minR = rows;
  let maxR = -1;
  let minC = cols;
  let maxC = -1;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (grid[r][c] === 1) {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    }
  }
  if (maxR < 0) return grid;
  const offR = Math.floor((rows - 1 - (maxR + minR)) / 2);
  const offC = Math.floor((cols - 1 - (maxC + minC)) / 2);
  if (offR === 0 && offC === 0) return grid;
  const out = zeros(rows, cols);
  for (let r = minR; r <= maxR; r += 1) {
    for (let c = minC; c <= maxC; c += 1) {
      if (grid[r][c] === 1) out[r + offR][c + offC] = 1;
    }
  }
  return out;
}

/** Mirror a half-width grid across the vertical axis into a full `cols`-wide grid. */
function mirror(half: Grid, cols: number): Grid {
  const halfW = half[0].length;
  return half.map((row) => Array.from({ length: cols }, (_, c) => row[c < halfW ? c : cols - 1 - c]));
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

export const filledCount = (grid: Grid): number =>
  grid.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0);

export interface SilhouetteParams {
  rows: number;
  cols: number;
  fill: number;
  symmetric: boolean; // mirror across the vertical axis (recognizable, low-tier)
  drift: number;      // asymmetry strength (0 = centered)
  roughen: number;    // 0..1 interior hollowing (shortens runs -> harder)
  maxRuns: number;    // reject busier lines (keeps analyzePuzzle fast)
  seeds?: number;     // growth seeds (>1 spreads large shapes across the canvas)
  seed: number;
}

/** Generate a connected silhouette meeting the run guard, or null if it couldn't. */
export function generateSilhouette(p: SilhouetteParams): Grid | null {
  const rng = mulberry32(p.seed);
  const seeds = p.seeds ?? 1;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    let grid: Grid;
    if (p.symmetric) {
      const halfW = Math.ceil(p.cols / 2);
      const half = growBlob(p.rows, halfW, p.fill, rng, 1.5, (rng() - 0.5) * 2, 1);
      grid = mirror(half, p.cols);
    } else {
      const ang = rng() * Math.PI * 2;
      grid = growBlob(p.rows, p.cols, p.fill, rng, Math.cos(ang) * p.drift, Math.sin(ang) * p.drift, seeds);
    }
    grid = roughen(grid, rng, p.roughen);
    grid = recenter(grid);
    if (filledCount(grid) < 3) continue;
    if (maxRunsPerLine(grid) <= p.maxRuns) return grid;
  }
  return null;
}

export const gridToAscii = (grid: Grid): string[] => grid.map((row) => row.map((c) => (c === 1 ? '#' : '.')).join(''));
export const asciiToGrid = (rows: string[]): Grid => rows.map((r) => r.split('').map((c) => (c === '#' ? 1 : 0)));
