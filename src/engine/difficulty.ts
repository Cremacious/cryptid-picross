import { Grid, Clues, Tier, DifficultyScore } from './puzzleTypes';

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

function bucket(area: number): Tier {
  if (area <= 64) return 'Easy'; // up to 8x8
  if (area <= 168) return 'Medium'; // up to ~12x14
  if (area <= 360) return 'Hard'; // up to ~18x20
  return 'Expert'; // 19x19+ (incl. 25x25)
}

export function scoreDifficulty(
  grid: Grid,
  rowClues: Clues,
  colClues: Clues,
  unique: boolean,
  depth: number,
): DifficultyScore {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  const area = rows * cols;

  // Axis 1 — Size
  const size = area <= 25 ? 1.0 : area >= 625 ? 5.0 : 1.0 + (4.0 * (area - 25)) / 600;

  // Axis 2 — Density
  const filled = grid.reduce((sum, line) => sum + line.reduce((a: number, b) => a + b, 0), 0);
  const fillRatio = area > 0 ? filled / area : 0;
  const deviation = Math.abs(fillRatio - 0.5) * 2;
  const density = Math.min(5, deviation * 5);

  // Axis 3 — Segment length
  const allRuns = [...rowClues, ...colClues].flat().filter((r) => r > 0);
  const avgRun = allRuns.length > 0 ? allRuns.reduce((a, b) => a + b, 0) / allRuns.length : 0;
  const segmentLength = avgRun >= 6 ? 0 : clamp(6 - avgRun, 0, 5);

  // Axis 4 — Asymmetry
  let horizontalDiffs = 0;
  let verticalDiffs = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (grid[r][c] !== grid[r][cols - 1 - c]) horizontalDiffs += 1;
      if (grid[r][c] !== grid[rows - 1 - r][c]) verticalDiffs += 1;
    }
  }
  const bestSymmetry = area > 0 ? Math.min(horizontalDiffs, verticalDiffs) / area : 0;
  const asymmetry = Math.min(5, bestSymmetry * 10);

  // Axis 5 — Solve depth
  const solveDepth = !unique ? 5.0 : clamp((depth - 1) * 0.8, 0, 5);

  const total = size + density + segmentLength + asymmetry + solveDepth;
  return { size, density, segmentLength, asymmetry, solveDepth, total, tier: bucket(area) };
}
