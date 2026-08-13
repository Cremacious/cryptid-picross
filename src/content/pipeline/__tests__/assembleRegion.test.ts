import { assembleRegion, validateRegion } from '@/content/pipeline/assembleRegion';
import type { PuzzleInput } from '@/content/buildPuzzle';
import type { FieldEntry } from '@/engine';

const entry: FieldEntry = { title: 'X', body: 'Y', voiceStyle: 'notebook' };
const meta = { id: 'pnw', name: 'PNW', tagline: 't', tint: '#5D6B4E', isFree: true };

const uniquePlus: PuzzleInput = {
  id: 'pnw-001', name: 'Plus', subtitle: 's',
  grid: [[0, 0, 1, 0, 0], [0, 0, 1, 0, 0], [1, 1, 1, 1, 1], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0]],
  entry, metadata: { regionId: 'pnw', order: 1, isCapstone: false },
};
const ambiguous: PuzzleInput = {
  id: 'pnw-002', name: 'Checker', subtitle: 's',
  grid: [[1, 0], [0, 1]], // 2x2 checkerboard -> not uniquely solvable
  entry, metadata: { regionId: 'pnw', order: 2, isCapstone: false },
};

describe('assembleRegion', () => {
  it('builds a region with derived puzzles', () => {
    const region = assembleRegion(meta, [uniquePlus]);
    expect(region.id).toBe('pnw');
    expect(region.totalPuzzles).toBe(1);
    expect(region.puzzles[0].rowClues).toEqual([[1], [1], [5], [1], [1]]);
    expect(region.puzzles[0].isUnique).toBe(true);
  });
});

describe('validateRegion', () => {
  it('returns no warnings for a clean region', () => {
    expect(validateRegion(assembleRegion(meta, [uniquePlus]))).toEqual([]);
  });

  it('warns about a puzzle that requires guessing', () => {
    const warnings = validateRegion(assembleRegion(meta, [ambiguous]));
    expect(warnings.some((w) => w.includes('pnw-002') && /guess/i.test(w))).toBe(true);
  });

  it('warns about duplicate puzzle ids', () => {
    const warnings = validateRegion(assembleRegion(meta, [uniquePlus, { ...uniquePlus }]));
    expect(warnings.some((w) => /duplicate/i.test(w))).toBe(true);
  });
});
