import { render, screen, fireEvent } from '@testing-library/react-native';
import { PuzzleGrid } from '@/components/organisms';
import { sampleRegions, getSampleRegion } from '@/content/sampleRegions';
import { deriveClues, type Tier } from '@/engine';
import { useUiStore } from '@/state';

jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light' } }));

const FREE = ['pnw', 'appalachia'];
const PAID = ['greatlakes', 'southwest', 'atlantic'];
const TARGET: Record<Tier, number> = { Easy: 12, Medium: 20, Hard: 18, Expert: 10 };

describe('puzzle catalog', () => {
  it('has 5 regions and 300 puzzles', () => {
    expect(sampleRegions).toHaveLength(5);
    expect(sampleRegions.reduce((n, r) => n + r.puzzles.length, 0)).toBe(300);
  });

  it('marks two regions free and three paid (all unlocked by the single $1.99 purchase)', () => {
    expect(sampleRegions.filter((r) => r.isFree).map((r) => r.id).sort()).toEqual([...FREE].sort());
    expect(sampleRegions.filter((r) => !r.isFree).map((r) => r.id).sort()).toEqual([...PAID].sort());
  });

  it.each(sampleRegions.map((r) => [r.id, r] as const))('region %s: 60 puzzles, correct tier split', (_id, region) => {
    expect(region.puzzles).toHaveLength(60);
    const tiers: Record<Tier, number> = { Easy: 0, Medium: 0, Hard: 0, Expert: 0 };
    for (const p of region.puzzles) tiers[p.difficulty.tier] += 1;
    expect(tiers).toEqual(TARGET);
  });

  it.each(sampleRegions.map((r) => [r.id, r] as const))('region %s: exactly one 25x25 capstone', (_id, region) => {
    const capstones = region.puzzles.filter((p) => p.metadata.isCapstone);
    expect(capstones).toHaveLength(1);
    expect(capstones[0].grid.length).toBe(25);
    expect(capstones[0].grid[0].length).toBe(25);
  });

  it('every puzzle is uniquely solvable with clues consistent with its grid', () => {
    for (const region of sampleRegions) {
      for (const p of region.puzzles) {
        expect(p.isUnique).toBe(true);
        expect(p.requiresGuessing).toBe(false);
        const { row, col } = deriveClues(p.grid);
        expect(p.rowClues).toEqual(row);
        expect(p.colClues).toEqual(col);
      }
    }
  });

  it('no grid ships twice anywhere in the catalog (directly or mirrored)', () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const region of sampleRegions) {
      for (const p of region.puzzles) {
        const key = p.grid.map((row) => row.join('')).join('/');
        const mirrored = p.grid.map((row) => [...row].reverse().join('')).join('/');
        const prior = seen.get(key) ?? seen.get(mirrored);
        if (prior) clashes.push(`${p.id} duplicates ${prior}`);
        seen.set(key, p.id);
      }
    }
    expect(clashes).toEqual([]);
  });

  it('no display name ships twice anywhere in the catalog', () => {
    const names = sampleRegions.flatMap((r) => r.puzzles.map((p) => p.name));
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    expect([...new Set(dupes)]).toEqual([]);
  });

  it('art is centered: blank framing lines are balanced on both axes', () => {
    const lopsided: string[] = [];
    for (const region of sampleRegions) {
      for (const p of region.puzzles) {
        const rows = p.grid.length;
        const cols = p.grid[0].length;
        const blankRow = (r: number) => p.grid[r].every((c) => c === 0);
        const blankCol = (c: number) => p.grid.every((row) => row[c] === 0);
        let top = 0; while (top < rows && blankRow(top)) top += 1;
        let bottom = 0; while (bottom < rows - top && blankRow(rows - 1 - bottom)) bottom += 1;
        let left = 0; while (left < cols && blankCol(left)) left += 1;
        let right = 0; while (right < cols - left && blankCol(cols - 1 - right)) right += 1;
        if (Math.abs(top - bottom) > 1 || Math.abs(left - right) > 1) {
          lopsided.push(`${p.id} (top=${top} bottom=${bottom} left=${left} right=${right})`);
        }
      }
    }
    expect(lopsided).toEqual([]);
  });
});

describe('generated puzzles are playable', () => {
  beforeEach(() => {
    useUiStore.setState({ target: null, cellState: [], history: [], tool: 'fill', errors: 0, status: 'idle', startedAt: null, elapsedMs: null });
  });

  it('a generated Easy puzzle reaches "won" when its solution cells are tapped', () => {
    const puzzle = getSampleRegion('pnw')!.puzzles.find((p) => p.difficulty.tier === 'Easy')!;
    const onWin = jest.fn();
    render(<PuzzleGrid puzzle={puzzle} mode="cozy" onWin={onWin} />);
    puzzle.grid.forEach((rowCells, r) =>
      rowCells.forEach((cell, c) => {
        if (cell === 1) fireEvent.press(screen.getByTestId(`cell-${r}-${c}`));
      }),
    );
    expect(useUiStore.getState().status).toBe('won');
    expect(onWin).toHaveBeenCalledTimes(1);
  });
});
