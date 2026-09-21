export function dims(grid: string[]): { rows: number; cols: number } {
  return { rows: grid.length, cols: grid[0]?.length ?? 0 };
}

export function normalizeGrid(grid: string[]): string[] {
  const width = grid[0]?.length ?? 0;
  for (const row of grid) {
    if (row.length !== width) throw new Error('variation: ragged grid');
    if (!/^[#.]*$/.test(row)) throw new Error('variation: grid must be # / . only');
  }
  return grid;
}

export function trimGrid(grid: string[]): string[] {
  let top = grid.length, bottom = -1, left = grid[0]?.length ?? 0, right = -1;
  grid.forEach((row, r) => {
    for (let c = 0; c < row.length; c += 1) {
      if (row[c] === '#') {
        top = Math.min(top, r); bottom = Math.max(bottom, r);
        left = Math.min(left, c); right = Math.max(right, c);
      }
    }
  });
  if (bottom < 0) throw new Error('variation: empty grid (no # cells)');
  const out: string[] = [];
  for (let r = top; r <= bottom; r += 1) out.push(grid[r].slice(left, right + 1));
  return out;
}

/**
 * Re-seat the drawing in the middle of its authored canvas: trim to the
 * bounding box, then pad back to the original dims with balanced margins
 * (extra line goes after, matching how art is read top-left first). Canvas
 * size — and therefore difficulty tier — is unchanged; only off-center art
 * (e.g. a fully blank right column) gets centered so reveals aren't lopsided.
 */
export function centerGrid(grid: string[]): string[] {
  const { rows, cols } = dims(grid);
  const inner = trimGrid(grid);
  const { rows: ir, cols: ic } = dims(inner);
  const offR = Math.floor((rows - ir) / 2);
  const offC = Math.floor((cols - ic) / 2);
  return padTo(inner, rows, cols, offR, offC);
}

export function flipH(grid: string[]): string[] {
  return grid.map((row) => row.split('').reverse().join(''));
}

export function padTo(grid: string[], rows: number, cols: number, offR: number, offC: number): string[] {
  const { rows: gr, cols: gc } = dims(grid);
  if (offR < 0 || offC < 0 || offR + gr > rows || offC + gc > cols) {
    throw new Error('variation: shape does not fit padded canvas');
  }
  const out: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    if (r < offR || r >= offR + gr) { out.push('.'.repeat(cols)); continue; }
    const row = grid[r - offR];
    out.push('.'.repeat(offC) + row + '.'.repeat(cols - offC - gc));
  }
  return out;
}
