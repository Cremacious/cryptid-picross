import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PNG } from 'pngjs';
import { importRegion } from '@/content/pipeline/importRegion';

// A 5x5 plus (uniquely solvable). Black+opaque = fill, white = empty.
const PLUS = [
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [1, 1, 1, 1, 1],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
];

function writePlusPng(file: string) {
  const png = new PNG({ width: 5, height: 5 });
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 5; x += 1) {
      const i = (y * 5 + x) * 4;
      const filled = PLUS[y][x] === 1;
      png.data[i] = filled ? 0 : 255;
      png.data[i + 1] = filled ? 0 : 255;
      png.data[i + 2] = filled ? 0 : 255;
      png.data[i + 3] = 255;
    }
  }
  fs.writeFileSync(file, PNG.sync.write(png));
}

describe('importRegion (end-to-end)', () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-import-'));
    writePlusPng(path.join(dir, 'pnw-001-testcryptid.png'));
    fs.writeFileSync(
      path.join(dir, 'entries.md'),
      '## pnw-001 · Test Cryptid\n\n**Voice:** notebook\n**Year:** 1974\n\nA shape stood at the crossing.\n',
    );
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('imports PNGs + entries into a validated region', () => {
    const { region, warnings } = importRegion({
      artDir: dir,
      entriesPath: path.join(dir, 'entries.md'),
      region: { id: 'pnw', name: 'PNW', tagline: 'trees watch', tint: '#5D6B4E', isFree: true },
    });
    expect(region.puzzles).toHaveLength(1);
    const p = region.puzzles[0];
    expect(p.id).toBe('pnw-001');
    expect(p.name).toBe('Test Cryptid');
    expect(p.grid).toEqual(PLUS);
    expect(p.rowClues).toEqual([[1], [1], [5], [1], [1]]);
    expect(p.isUnique).toBe(true);
    expect(p.entry.body).toMatch(/crossing/);
    expect(p.entry.yearReported).toBe(1974);
    expect(warnings).toEqual([]);
  });

  it('warns when a PNG has no matching entry', () => {
    writePlusPng(path.join(dir, 'pnw-002-orphan.png'));
    const { warnings } = importRegion({
      artDir: dir,
      entriesPath: path.join(dir, 'entries.md'),
      region: { id: 'pnw', name: 'PNW', tagline: 't', tint: '#5D6B4E', isFree: true },
    });
    expect(warnings.some((w) => w.includes('pnw-002'))).toBe(true);
  });
});
