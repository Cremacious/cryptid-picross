import { Cell, Clues } from './puzzleTypes';
import { possibleLines, intersectLines } from './lines';

type Known = (Cell | null)[];

const matches = (candidate: Cell[], known: Known): boolean => {
  for (let i = 0; i < known.length; i += 1) {
    if (known[i] !== null && known[i] !== candidate[i]) return false;
  }
  return true;
};

/**
 * Line-by-line constraint propagation.
 * unique:true  => fully determined by pure logic (good puzzle).
 * unique:false => multiple solutions or needs guessing (bad puzzle).
 * depth        => propagation rounds used (logical difficulty, size-independent).
 */
export function analyzePuzzle(rowClues: Clues, colClues: Clues): { unique: boolean; depth: number } {
  const rows = rowClues.length;
  const cols = colClues.length;
  const grid: Known[] = Array.from({ length: rows }, () => new Array<Cell | null>(cols).fill(null));
  const rowCands = rowClues.map((c) => possibleLines(c, cols));
  const colCands = colClues.map((c) => possibleLines(c, rows));

  for (let depth = 1; depth <= 50; depth += 1) {
    let changed = false;

    for (let r = 0; r < rows; r += 1) {
      rowCands[r] = rowCands[r].filter((cand) => matches(cand, grid[r]));
      if (rowCands[r].length === 0) return { unique: false, depth };
      const inter = intersectLines(rowCands[r]);
      for (let c = 0; c < cols; c += 1) {
        if (inter[c] !== null && grid[r][c] === null) {
          grid[r][c] = inter[c];
          changed = true;
        }
      }
    }

    for (let c = 0; c < cols; c += 1) {
      const known: Known = grid.map((row) => row[c]);
      colCands[c] = colCands[c].filter((cand) => matches(cand, known));
      if (colCands[c].length === 0) return { unique: false, depth };
      const inter = intersectLines(colCands[c]);
      for (let r = 0; r < rows; r += 1) {
        if (inter[r] !== null && grid[r][c] === null) {
          grid[r][c] = inter[r];
          changed = true;
        }
      }
    }

    const solved = grid.every((row) => row.every((cell) => cell !== null));
    if (solved) return { unique: true, depth };
    if (!changed) return { unique: false, depth };
  }

  return { unique: false, depth: 50 };
}
