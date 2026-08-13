import { computeCellSize, computeClueFontSize } from '@/components/organisms/gridSizing';

describe('computeCellSize', () => {
  it('grows a small grid toward the max on a roomy phone', () => {
    // 390x844 phone, 5x5 -> width allows ~62/cell, clamped to the 56 cap
    expect(computeCellSize({ windowWidth: 390, windowHeight: 844, cols: 5, rows: 5 })).toBe(56);
  });
  it('shrinks a big grid to the min so it still fits', () => {
    // 25x25 -> far below min -> clamps to 14
    expect(computeCellSize({ windowWidth: 390, windowHeight: 844, cols: 25, rows: 25 })).toBe(14);
  });
  it('is limited by height when the window is short', () => {
    // very short window forces small cells even for few rows
    const size = computeCellSize({ windowWidth: 390, windowHeight: 360, cols: 5, rows: 5 });
    expect(size).toBeLessThan(56);
    expect(size).toBeGreaterThanOrEqual(14);
  });
  it('falls back to the min when dimensions are unknown (jest / first render)', () => {
    expect(computeCellSize({ windowWidth: 0, windowHeight: 0, cols: 5, rows: 5 })).toBe(14);
  });
});

describe('computeClueFontSize', () => {
  it('scales with cell size, clamped to a legible range', () => {
    expect(computeClueFontSize(56)).toBe(18); // 56*0.36=20.16 -> clamp 18
    expect(computeClueFontSize(14)).toBe(11); // 14*0.36=5.04 -> clamp 11
    expect(computeClueFontSize(40)).toBe(14); // 40*0.36=14.4 -> 14
  });
});
