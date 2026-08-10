import { Cell, Line, Grid, Clue, Clues } from './puzzleTypes';

export function lineClues(line: Line): Clue {
  const runs: number[] = [];
  let current = 0;
  for (const cell of line) {
    if (cell === 1) {
      current += 1;
    } else if (current > 0) {
      runs.push(current);
      current = 0;
    }
  }
  if (current > 0) runs.push(current);
  return runs.length > 0 ? runs : [0];
}

export function deriveClues(grid: Grid): { row: Clues; col: Clues } {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  const row: Clues = grid.map((line) => lineClues(line));
  const col: Clues = [];
  for (let c = 0; c < cols; c += 1) {
    const column: Cell[] = [];
    for (let r = 0; r < rows; r += 1) column.push(grid[r][c]);
    col.push(lineClues(column));
  }
  return { row, col };
}
