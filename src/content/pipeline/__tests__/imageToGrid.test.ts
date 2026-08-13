import { imageToGrid } from '@/content/pipeline/imageToGrid';

// helper: build an RGBA buffer from a map fn
const rgba = (w: number, h: number, at: (x: number, y: number) => [number, number, number, number]) => {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const [r, g, b, a] = at(x, y);
      const i = (y * w + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a;
    }
  }
  return data;
};

describe('imageToGrid', () => {
  it('fills dark, opaque pixels and leaves white/transparent empty', () => {
    // 2x2: top-left black (fill), top-right white (empty), bottom-left transparent (empty), bottom-right dark-but-transparent (empty)
    const data = rgba(2, 2, (x, y) => {
      if (x === 0 && y === 0) return [0, 0, 0, 255]; // fill
      if (x === 1 && y === 0) return [255, 255, 255, 255]; // white -> empty
      if (x === 0 && y === 1) return [0, 0, 0, 0]; // transparent -> empty
      return [10, 10, 10, 0]; // dark but transparent -> empty
    });
    expect(imageToGrid(data, 2, 2)).toEqual([[1, 0], [0, 0]]);
  });

  it('respects the threshold boundary (avg < threshold fills)', () => {
    const gray = rgba(1, 1, () => [127, 127, 127, 255]);
    const lighter = rgba(1, 1, () => [128, 128, 128, 255]);
    expect(imageToGrid(gray, 1, 1, 128)).toEqual([[1]]); // 127 < 128 -> fill
    expect(imageToGrid(lighter, 1, 1, 128)).toEqual([[0]]); // 128 not < 128 -> empty
  });

  it('produces a grid of the right dimensions', () => {
    const data = rgba(3, 2, () => [0, 0, 0, 255]);
    const grid = imageToGrid(data, 3, 2);
    expect(grid.length).toBe(2);
    expect(grid[0].length).toBe(3);
  });
});
