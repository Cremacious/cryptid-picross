/**
 * Build-time CLI: turn a region manifest + its PNG art + entries.md into a validated
 * region JSON under src/content/regions/. A thin wrapper over runImport() — argument
 * parsing, console reporting, the file write, and exit codes live here; the resolve +
 * pipeline logic (and its tests) live in src/content/pipeline/runImport.ts.
 *
 * Usage:
 *   npm run import-region -- <manifest.json> [--out <dir>] [--force]
 *
 * Exit codes: 0 written · 1 content warnings (nothing written unless --force) · 2 bad usage/manifest.
 */
import * as fs from 'fs';
import * as path from 'path';
import { runImport } from '@/content/pipeline/runImport';

interface Args {
  manifestPath?: string;
  outDir?: string;
  force: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--force') {
      args.force = true;
    } else if (a === '--out') {
      args.outDir = argv[i + 1];
      i += 1;
    } else if (!a.startsWith('-') && !args.manifestPath) {
      args.manifestPath = a;
    }
  }
  return args;
}

function main(): void {
  const { manifestPath, outDir, force } = parseArgs(process.argv.slice(2));
  if (!manifestPath) {
    console.error('Usage: npm run import-region -- <manifest.json> [--out <dir>] [--force]');
    process.exit(2);
  }

  let result;
  try {
    result = runImport(manifestPath, { outDir });
  } catch (e) {
    console.error(`✗ ${(e as Error).message}`);
    process.exit(2);
    return;
  }

  const { region, warnings, outPath } = result;

  console.log(`Region "${region.id}" — ${region.puzzles.length} puzzle(s):`);
  for (const p of region.puzzles) {
    const rows = p.grid.length;
    const cols = rows > 0 ? p.grid[0].length : 0;
    console.log(`  • ${p.id}  ${rows}x${cols}  ${p.name}`);
  }

  if (warnings.length > 0) {
    console.error(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.error(`  ! ${w}`);
    if (!force) {
      console.error('\nNothing written. Fix the content, or re-run with --force to write anyway.');
      process.exit(1);
      return;
    }
    console.error('\n--force set: writing despite warnings.');
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(region, null, 2)}\n`, 'utf8');
  console.log(`\n✓ Wrote ${outPath}`);
}

if (require.main === module) {
  main();
}
