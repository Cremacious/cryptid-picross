import { colors, spacing, typography } from '@/theme';

describe('theme tokens via @/ alias', () => {
  it('exposes the paper.cream background', () => {
    expect(colors.paper.cream).toBe('#F1E8D3');
  });

  it('exposes the muted oxblood stamp red (not pure red)', () => {
    expect(colors.accent.stampRed).toBe('#9B3B2E');
    expect(colors.accent.stampRed).not.toBe('#FF0000');
  });

  it('uses a 4-point spacing scale', () => {
    expect(spacing.md).toBe(16);
  });

  it('names the display font Special Elite', () => {
    expect(typography.fontFamily.display).toBe('SpecialElite_400Regular');
  });
});
