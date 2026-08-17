import { computeGridLayout } from '@/components/organisms/gridSizing';

const base = { windowWidth: 390, windowHeight: 844, maxRowClue: 3, maxColClue: 3 };

describe('computeGridLayout', () => {
  it('grows a small grid toward the cell cap', () => {
    const l = computeGridLayout({ ...base, rows: 5, cols: 5 });
    expect(l.cellSize).toBe(56);
    expect(l.clueFont).toBeLessThanOrEqual(13);
  });

  it('fits a big grid on screen: cells shrink but the whole board still fits the width', () => {
    const l = computeGridLayout({ windowWidth: 390, windowHeight: 844, rows: 25, cols: 25, maxRowClue: 5, maxColClue: 5 });
    const totalWidth = l.rowGutter + l.cellSize * 25 + 16 * 2; // + screen padding
    expect(totalWidth).toBeLessThanOrEqual(390);
    expect(l.cellSize).toBeGreaterThanOrEqual(9); // never untappably tiny
  });

  it('widens the clue gutters for longer clues', () => {
    const few = computeGridLayout({ ...base, rows: 15, cols: 15, maxRowClue: 1, maxColClue: 1 });
    const many = computeGridLayout({ ...base, rows: 15, cols: 15, maxRowClue: 6, maxColClue: 6 });
    expect(many.rowGutter).toBeGreaterThan(few.rowGutter);
    expect(many.colGutter).toBeGreaterThan(few.colGutter);
  });

  it('scales the clue font down with the cell so digits fit the pills', () => {
    const big = computeGridLayout({ ...base, rows: 5, cols: 5 });
    const small = computeGridLayout({ ...base, rows: 25, cols: 25, maxRowClue: 5, maxColClue: 5 });
    expect(small.clueFont).toBeLessThan(big.clueFont);
  });

  it('falls back gracefully when dimensions are unknown (jest / first render)', () => {
    const l = computeGridLayout({ windowWidth: 0, windowHeight: 0, rows: 5, cols: 5, maxRowClue: 3, maxColClue: 3 });
    expect(l.cellSize).toBe(9);
  });
});
