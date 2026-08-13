import { render, screen, fireEvent } from '@testing-library/react-native';
import { PuzzleGrid } from '@/components/organisms';
import { sampleRegions, getSampleRegion } from '@/content/sampleRegions';
import { deriveClues, type Tier } from '@/engine';
import { useUiStore } from '@/state';

jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light' } }));

const FREE = ['pnw', 'appalachia'];
const PAID = ['greatlakes', 'southwest', 'atlantic'];
const TARGET: Record<Tier, number> = { Easy: 25, Medium: 35, Hard: 30, Expert: 10 };

describe('puzzle catalog', () => {
  it('has 5 regions and 500 puzzles', () => {
    expect(sampleRegions).toHaveLength(5);
    expect(sampleRegions.reduce((n, r) => n + r.puzzles.length, 0)).toBe(500);
  });

  it('marks two regions free and three paid', () => {
    expect(sampleRegions.filter((r) => r.isFree).map((r) => r.id).sort()).toEqual([...FREE].sort());
    expect(sampleRegions.filter((r) => !r.isFree).map((r) => r.id).sort()).toEqual([...PAID].sort());
  });

  it('gives every paid region a product id', () => {
    for (const id of PAID) expect(getSampleRegion(id)?.iapProductId).toBeTruthy();
  });

  it.each(sampleRegions.map((r) => [r.id, r] as const))('region %s: 100 puzzles, correct tier split', (_id, region) => {
    expect(region.puzzles).toHaveLength(100);
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
