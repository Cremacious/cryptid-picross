import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PNG } from 'pngjs';
import { runImport } from '@/content/pipeline/runImport';

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

describe('runImport (manifest → region)', () => {
  let dir: string;
  let artDir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-runimport-'));
    artDir = path.join(dir, 'art');
    fs.mkdirSync(artDir);
    writePlusPng(path.join(artDir, 'pnw-001-testcryptid.png'));
    fs.writeFileSync(
      path.join(dir, 'entries.md'),
      '## pnw-001 · Test Cryptid\n\n**Voice:** notebook\n**Year:** 1974\n\nA shape stood at the crossing.\n',
    );
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  function writeManifest(extra: Record<string, unknown> = {}): string {
    const manifestPath = path.join(dir, 'region.json');
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({
        id: 'pnw',
        name: 'The Pacific Northwest',
        tagline: 'Where the trees watch',
        tint: '#5D6B4E',
        isFree: true,
        artDir: './art',
        entriesPath: './entries.md',
        ...extra,
      }),
    );
    return manifestPath;
  }

  it('resolves relative art/entries paths against the manifest and builds the region', () => {
    const { region, warnings, outPath } = runImport(writeManifest(), { outDir: path.join(dir, 'out') });
    expect(region.id).toBe('pnw');
    expect(region.name).toBe('The Pacific Northwest');
    expect(region.puzzles).toHaveLength(1);
    expect(region.puzzles[0].id).toBe('pnw-001');
    expect(region.puzzles[0].grid).toEqual(PLUS);
    expect(warnings).toEqual([]);
    expect(outPath).toBe(path.join(dir, 'out', 'pnw.json'));
  });

  it('passes meta through, including iapProductId for paid regions', () => {
    const { region } = runImport(writeManifest({ isFree: false, iapProductId: 'region.pnw' }), {
      outDir: path.join(dir, 'out'),
    });
    expect(region.isFree).toBe(false);
    expect(region.iapProductId).toBe('region.pnw');
  });

  it('throws when a required meta field is missing', () => {
    const manifestPath = path.join(dir, 'region.json');
    fs.writeFileSync(manifestPath, JSON.stringify({ id: 'pnw', artDir: './art', entriesPath: './entries.md' }));
    expect(() => runImport(manifestPath)).toThrow(/missing required field "name"/);
  });

  it('throws when the manifest is not valid JSON', () => {
    const manifestPath = path.join(dir, 'region.json');
    fs.writeFileSync(manifestPath, '{ not json');
    expect(() => runImport(manifestPath)).toThrow(/not valid JSON/);
  });

  it('surfaces pipeline warnings (e.g. a PNG with no matching entry)', () => {
    writePlusPng(path.join(artDir, 'pnw-002-orphan.png'));
    const { warnings } = runImport(writeManifest(), { outDir: path.join(dir, 'out') });
    expect(warnings.some((w) => w.includes('pnw-002'))).toBe(true);
  });
});
