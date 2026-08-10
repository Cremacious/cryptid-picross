import { Cell, Line, Clue } from './puzzleTypes';

/**
 * Every valid placement of `clue`'s runs in a line of `length`, left to right,
 * with at least one empty cell between consecutive runs. Clue [0] => one all-empty line.
 */
export function possibleLines(clue: Clue, length: number): Line[] {
  const runs = clue.length === 1 && clue[0] === 0 ? [] : clue;
  const results: Line[] = [];

  const place = (index: number, from: number, acc: Cell[]): void => {
    if (index === runs.length) {
      const line = acc.slice();
      while (line.length < length) line.push(0);
      results.push(line);
      return;
    }
    const runLen = runs[index];
    const rest = runs.slice(index);
    const minTail = rest.reduce((a, b) => a + b, 0) + (rest.length - 1); // this run + gaps + rest
    const maxStart = length - minTail;
    for (let start = from; start <= maxStart; start += 1) {
      const next = acc.slice();
      while (next.length < start) next.push(0); // gap/leading zeros
      for (let k = 0; k < runLen; k += 1) next.push(1);
      const isLast = index === runs.length - 1;
      if (!isLast) next.push(0); // mandatory single gap
      place(index + 1, start + runLen + (isLast ? 0 : 1), next);
    }
  };

  place(0, 0, []);
  return results;
}

/** Per-cell: 1 if all candidates fill it, 0 if all leave it empty, null if they disagree. */
export function intersectLines(candidates: Line[]): (Cell | null)[] {
  if (candidates.length === 0) return [];
  const len = candidates[0].length;
  const out: (Cell | null)[] = [];
  for (let i = 0; i < len; i += 1) {
    const first = candidates[0][i];
    const allSame = candidates.every((c) => c[i] === first);
    out.push(allSame ? first : null);
  }
  return out;
}
