import { dims, normalizeGrid, trimGrid, flipH, padTo } from '../variation';

describe('variation helpers', () => {
  it('dims reports rows and cols', () => {
    expect(dims(['##.', '..#'])).toEqual({ rows: 2, cols: 3 });
  });

  it('normalizeGrid rejects ragged rows', () => {
    expect(() => normalizeGrid(['##', '#'])).toThrow();
  });

  it('normalizeGrid rejects stray characters', () => {
    expect(() => normalizeGrid(['#x'])).toThrow();
  });

  it('trimGrid crops to the filled bounding box', () => {
    expect(trimGrid(['....', '.##.', '.#..', '....'])).toEqual(['##', '#.']);
  });

  it('flipH mirrors horizontally', () => {
    expect(flipH(['#..', '.##'])).toEqual(['..#', '##.']);
  });

  it('padTo centers a shape into a larger canvas', () => {
    expect(padTo(['#'], 3, 3, 1, 1)).toEqual(['...', '.#.', '...']);
  });

  it('padTo throws when the shape does not fit', () => {
    expect(() => padTo(['##'], 2, 2, 0, 1)).toThrow();
  });
});
