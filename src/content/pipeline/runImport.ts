import * as fs from 'fs';
import * as path from 'path';
import { Region } from '@/engine';
import { importRegion } from './importRegion';
import { RegionMeta } from './assembleRegion';

/**
 * A region manifest: the `RegionMeta` fields plus where to find its art and entries.
 * `artDir` and `entriesPath` are resolved relative to the manifest file's own location,
 * so a manifest and its content can live together and move together.
 */
export interface RegionManifest extends RegionMeta {
  artDir: string;
  entriesPath: string;
}

export interface RunImportResult {
  region: Region;
  warnings: string[];
  /** Where the CLI will write the validated region JSON. */
  outPath: string;
}

const REQUIRED_META: (keyof RegionMeta)[] = ['id', 'name', 'tagline', 'tint', 'isFree'];

/**
 * Build-time only: read a region manifest, resolve its art + entries paths, run the
 * import pipeline, and report where the result should be written. Pure aside from
 * reading its inputs — the caller does the actual write, so this stays easy to test.
 * Throws on a malformed manifest (bad JSON, missing required field).
 */
export function runImport(manifestPath: string, opts: { outDir?: string } = {}): RunImportResult {
  const manifestAbs = path.resolve(manifestPath);
  const raw = fs.readFileSync(manifestAbs, 'utf8');

  let manifest: RegionManifest;
  try {
    manifest = JSON.parse(raw) as RegionManifest;
  } catch (e) {
    throw new Error(`manifest is not valid JSON: ${manifestAbs}\n  ${(e as Error).message}`);
  }

  for (const key of REQUIRED_META) {
    const value = manifest[key];
    if (value === undefined || value === null || value === '') {
      throw new Error(`manifest is missing required field "${key}": ${manifestAbs}`);
    }
  }
  if (!manifest.artDir || !manifest.entriesPath) {
    throw new Error(`manifest must set "artDir" and "entriesPath": ${manifestAbs}`);
  }

  const manifestDir = path.dirname(manifestAbs);
  const artDir = path.resolve(manifestDir, manifest.artDir);
  const entriesPath = path.resolve(manifestDir, manifest.entriesPath);

  const region: RegionMeta = {
    id: manifest.id,
    name: manifest.name,
    tagline: manifest.tagline,
    tint: manifest.tint,
    isFree: manifest.isFree,
    iapProductId: manifest.iapProductId,
  };

  const { region: built, warnings } = importRegion({ artDir, entriesPath, region });

  const outDir = opts.outDir ?? path.resolve(process.cwd(), 'src/content/regions');
  const outPath = path.join(outDir, `${built.id}.json`);

  return { region: built, warnings, outPath };
}
