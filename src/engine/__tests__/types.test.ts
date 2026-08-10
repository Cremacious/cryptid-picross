import type {
  Cell, Grid, Clue, Clues, PlayGrid, Tier, DifficultyScore,
  Puzzle, FieldEntry, VoiceStyle, Region, PurchaseInfo,
} from '@/engine/puzzleTypes';

describe('domain types', () => {
  it('compose into valid values', () => {
    const grid: Grid = [[0, 1], [1, 0]];
    const clues: Clues = [[1], [1]];
    const play: PlayGrid = [[0, 2], [1, 0]];
    const tier: Tier = 'Expert';
    const voice: VoiceStyle = 'notebook';
    const cell: Cell = 1;
    const clue: Clue = [2, 3];
    const score: DifficultyScore = {
      size: 1, density: 1, segmentLength: 1, asymmetry: 0, solveDepth: 0, total: 4, tier: 'Easy',
    };
    const entry: FieldEntry = { title: 'X', body: 'Y', voiceStyle: voice };
    const purchases: PurchaseInfo = {
      ownedRegions: ['pnw'], ownedPacks: [], purchasedFullBundle: false, lastRestoredAt: null,
    };
    expect(grid[0][1]).toBe(1);
    expect(clues.length).toBe(2);
    expect(play[0][1]).toBe(2);
    expect(tier).toBe('Expert');
    expect(cell).toBe(1);
    expect(clue).toEqual([2, 3]);
    expect(score.tier).toBe('Easy');
    expect(entry.voiceStyle).toBe('notebook');
    expect(purchases.ownedRegions[0]).toBe('pnw');
  });
});
