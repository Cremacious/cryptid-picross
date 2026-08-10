import { buildPuzzle } from '@/content/buildPuzzle';
import { getSamplePuzzle, samplePuzzles } from '@/content/samplePuzzles';
import type { FieldEntry, PuzzleMetadata } from '@/engine';

const entry: FieldEntry = { title: 'X', body: 'Y', voiceStyle: 'notebook' };
const metadata: PuzzleMetadata = { regionId: 'pnw', order: 1, isCapstone: false };

describe('buildPuzzle', () => {
  it('derives clues, fill ratio, uniqueness, and difficulty from the grid', () => {
    const p = buildPuzzle({
      id: 'plus',
      name: 'Plus',
      subtitle: 'test',
      grid: [
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [1, 1, 1, 1, 1],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
      ],
      entry,
      metadata,
    });
    expect(p.rowClues).toEqual([[1], [1], [5], [1], [1]]);
    expect(p.colClues).toEqual([[1], [1], [5], [1], [1]]);
    expect(p.fillRatio).toBeCloseTo(9 / 25, 5);
    expect(p.isUnique).toBe(true);
    expect(p.requiresGuessing).toBe(false);
    expect(p.difficulty.tier).toBe('Easy');
  });
});

describe('samplePuzzles', () => {
  it('provides at least one uniquely-solvable puzzle with a field entry', () => {
    expect(samplePuzzles.length).toBeGreaterThanOrEqual(1);
    samplePuzzles.forEach((p) => {
      expect(p.isUnique).toBe(true);
      expect(p.entry.body.length).toBeGreaterThan(0);
      expect(p.rowClues.length).toBe(p.grid.length);
    });
  });

  it('looks up a sample by id', () => {
    const first = samplePuzzles[0];
    expect(getSamplePuzzle(first.id)?.id).toBe(first.id);
    expect(getSamplePuzzle('nope')).toBeUndefined();
  });
});
