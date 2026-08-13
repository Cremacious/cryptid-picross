# Build-time scripts

## `import-region` — art + entries → validated region JSON

Turns a folder of pixel-art PNGs plus an `entries.md` into a validated `Region`
JSON file under `src/content/regions/`. The engine derives each puzzle's clues,
difficulty, and unique-solvability from the art, and the import refuses to write
if anything looks broken.

```bash
npm run import-region -- <manifest.json> [--out <dir>] [--force]
```

### Manifest

A JSON file describing one region. `artDir` and `entriesPath` are resolved
relative to the manifest file itself, so a region's config and content can live
in one folder:

```json
{
  "id": "pnw",
  "name": "The Pacific Northwest",
  "tagline": "Where the trees watch",
  "tint": "#5D6B4E",
  "isFree": true,
  "iapProductId": "region.pnw",
  "artDir": "./art",
  "entriesPath": "./entries.md"
}
```

`iapProductId` is only needed for paid regions (`isFree: false`).

### Art files

Name each PNG `{regionId}-{order}-{slug}.png` (e.g. `pnw-001-thecrossing.png`).
Black + opaque pixels are filled cells; white/transparent are empty. A 25×25
grid is treated as a region capstone.

### Entries

`entries.md` holds one block per puzzle, keyed by `{regionId}-{order}`:

```markdown
## pnw-001 · The Crossing

**Voice:** notebook
**Year:** 1974
**Credibility:** medium

A shape stood at the intersection of two logging roads at dusk.
```

### Exit codes

- **0** — region written (or written with `--force` despite warnings).
- **1** — content warnings (non-unique puzzle, missing entry, orphan/mis-sized
  art, duplicate id). Nothing is written; fix the content or pass `--force`.
- **2** — bad usage or an unreadable/malformed manifest.

### Wiring a generated region into the app

The importer only produces the JSON. To make the app use it, import the file in
`src/content/sampleRegions.ts` in place of (or alongside) the hardcoded sample
regions — e.g. `import pnw from './regions/pnw.json';` — since `Region` is a
plain data shape. This step is intentionally manual: it's a one-liner once real
art exists, and there's nothing to wire until then.
```
