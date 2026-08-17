import { computeCellSize, computeClueFontSize } from '@/components/organisms/gridSizing';

describe('computeCellSize', () => {
  it('grows a small grid toward the max on a roomy phone', () => {
    // 390x844 phone, 5x5 -> width allows ~62/cell, clamped to the 56 cap
    expect(computeCellSize({ windowWidth: 390, windowHeight: 844, cols: 5, rows: 5 })).toBe(56);
  });
  it('holds a big grid at the tappable min (it scrolls instead of shrinking)', () => {
    // 25x25 -> far below min -> clamps up to PLAY_CELL_MIN (30); grid scrolls.
    expect(computeCellSize({ windowWidth: 390, windowHeight: 844, cols: 25, rows: 25 })).toBe(30);
  });
  it('never drops below the tappable min even on a short window', () => {
    const size = computeCellSize({ windowWidth: 390, windowHeight: 360, cols: 5, rows: 5 });
    expect(size).toBeLessThanOrEqual(56);
    expect(size).toBeGreaterThanOrEqual(30);
  });
  it('falls back to the min when dimensions are unknown (jest / first render)', () => {
    expect(computeCellSize({ windowWidth: 0, windowHeight: 0, cols: 5, rows: 5 })).toBe(30);
  });
});

describe('computeClueFontSize', () => {
  it('scales with cell size, clamped to a legible range', () => {
    expect(computeClueFontSize(56)).toBe(18); // 56*0.36=20.16 -> clamp 18
    expect(computeClueFontSize(14)).toBe(11); // 14*0.36=5.04 -> clamp 11
    expect(computeClueFontSize(40)).toBe(14); // 40*0.36=14.4 -> 14
  });
});
