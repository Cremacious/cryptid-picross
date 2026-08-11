import { sampleRegions, getSampleRegion, getPuzzleById } from '@/content/sampleRegions';

describe('sampleRegions', () => {
  it('exposes a free PNW region containing the sample puzzles', () => {
    const pnw = getSampleRegion('pnw');
    expect(pnw).toBeDefined();
    expect(pnw?.isFree).toBe(true);
    expect(pnw?.puzzles.length).toBeGreaterThanOrEqual(2);
    expect(pnw?.totalPuzzles).toBe(pnw?.puzzles.length);
  });

  it('includes a locked (paid) region to exercise lock state', () => {
    const locked = sampleRegions.find((r) => !r.isFree);
    expect(locked).toBeDefined();
    expect(locked?.puzzles.length).toBeGreaterThanOrEqual(1);
  });

  it('returns undefined for an unknown region id', () => {
    expect(getSampleRegion('nope')).toBeUndefined();
  });

  it('every region puzzle is uniquely solvable with clues derived', () => {
    sampleRegions.forEach((r) => {
      r.puzzles.forEach((p) => {
        expect(p.isUnique).toBe(true);
        expect(p.rowClues.length).toBe(p.grid.length);
      });
    });
  });

  it('resolves every region puzzle by id via getPuzzleById', () => {
    sampleRegions.forEach((r) => {
      r.puzzles.forEach((p) => {
        expect(getPuzzleById(p.id)?.id).toBe(p.id);
      });
    });
  });

  it('resolves the locked region puzzle that routes previously could not find', () => {
    expect(getPuzzleById('appalachia-001')).toBeDefined();
  });

  it('returns undefined for an unknown puzzle id', () => {
    expect(getPuzzleById('nope')).toBeUndefined();
  });
});
