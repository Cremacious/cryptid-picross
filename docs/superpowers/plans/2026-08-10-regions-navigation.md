# Regions & Puzzle List Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the navigation into the game — a sample `Region` content structure, a `RegionsScreen` (list of `RegionCard`s with lock + progress), a `PuzzleListScreen` (`PuzzleCard`s with solved/best-time state), and `/regions` + `/region/[id]` routes wiring Home → Regions → Puzzle List → Puzzle.

**Architecture:** `sampleRegions` groups the existing sample puzzles into `Region` objects (one free, one locked) — a content stand-in until the pipeline lands. `RegionsScreen` and `PuzzleListScreen` are testable components that read `purchaseStore`/`progressStore` for lock + progress and render the already-built `RegionCard`/`PuzzleCard` molecules; they take the region data + navigation callbacks as props. The route files stay thin (resolve content + wire router). This extends the loop to Home → Regions → Puzzle List → puzzle → reveal.

**Tech Stack:** React Native + Expo Router, TypeScript, Zustand (`@/state`), Jest + `@testing-library/react-native` v13.

## Global Constraints

- Never inline color/spacing/font values; import from `@/theme`. Region `tint` is data sourced from `colors.region.*`. (COMPONENT_LIBRARY.md Design System Quick Reference; DATA_AND_ENGINE.md §1.5)
- Screens import atoms/molecules/organisms/stores/utils; routes import screens/content/stores. No upward imports. (COMPONENT_LIBRARY.md Part 6)
- Lock state: a region is locked when `!region.isFree && !purchaseStore.ownsRegion(region.id)`. Region 1 (pnw) is free. (SCREEN_SPECS.md Screen 3; DATA_AND_ENGINE.md §1.5)
- Progress: a region's `{solved, total}` = count of its puzzles present in `progressStore.solved`, over `region.totalPuzzles`. A puzzle is solved when its id is in `progressStore.solved`; unsolved puzzle names show as "???". (SCREEN_SPECS.md Screens 3–4)
- Do NOT hand-author puzzle derived fields — sample content uses `buildPuzzle`. (DATA_AND_ENGINE.md §2.1)
- `@testing-library/react-native` is v13 — synchronous `render`/`fireEvent`; reset singleton stores (`progressStore`, `purchaseStore`) in `beforeEach` where asserted.
- Every commit message ends with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Project root: `/home/chris/Code/cryptid-picross`.

---

### Task 1: sampleRegions content

Group the sample puzzles into `Region` objects (one free "PNW", one locked "Appalachia" to exercise lock state). (DATA_AND_ENGINE.md §1.5)

**Files:**
- Create: `src/content/sampleRegions.ts`
- Test: `src/content/__tests__/sampleRegions.test.ts`

**Interfaces:**
- Consumes: `@/engine` (`Region`, `Puzzle`); `@/theme` (`colors`); `buildPuzzle` from `./buildPuzzle`; `samplePuzzles` from `./samplePuzzles`.
- Produces: `sampleRegions: Region[]` and `getSampleRegion(id: string): Region | undefined`.

- [ ] **Step 1: Write the failing test**

Create `src/content/__tests__/sampleRegions.test.ts`:
```typescript
import { sampleRegions, getSampleRegion } from '@/content/sampleRegions';

describe('sampleRegions', () => {
  it('exposes a free PNW region containing the sample puzzles', () => {
    const pnw = getSampleRegion('pnw');
    expect(pnw).toBeDefined();
    expect(pnw?.isFree).toBe(true);
    expect(pnw?.puzzles.length).toBeGreaterThanOrEqual(2);
    expect(pnw?.totalPuzzles).toBe(pnw?.puzzles.length);
  });

  it('includes a locked (paid) region to exercise lock state', () => {
    const locked = sampleRegions.find((r) => !r.isFree);
    expect(locked).toBeDefined();
    expect(locked?.puzzles.length).toBeGreaterThanOrEqual(1);
  });

  it('returns undefined for an unknown region id', () => {
    expect(getSampleRegion('nope')).toBeUndefined();
  });

  it('every region puzzle is uniquely solvable with clues derived', () => {
    sampleRegions.forEach((r) => {
      r.puzzles.forEach((p) => {
        expect(p.isUnique).toBe(true);
        expect(p.rowClues.length).toBe(p.grid.length);
      });
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- sampleRegions` → FAIL.

- [ ] **Step 3: Implement**

Create `src/content/sampleRegions.ts`:
```typescript
import { Region } from '@/engine';
import { colors } from '@/theme';
import { buildPuzzle } from './buildPuzzle';
import { samplePuzzles } from './samplePuzzles';

// A second region's puzzle (locked/paid) to exercise lock + purchase flows.
const appalachiaPuzzles = [
  buildPuzzle({
    id: 'appalachia-001',
    name: 'The Hollow',
    subtitle: 'Unidentified · Field Test',
    grid: [
      [0, 1, 1, 1, 0],
      [1, 1, 0, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 0, 1, 1],
      [0, 1, 1, 1, 0],
    ],
    entry: {
      title: 'THE HOLLOW · Case 101',
      body: 'Something circled the hollow three times and did not come back a fourth. The dogs would not follow.',
      voiceStyle: 'firstPerson',
      yearReported: 1991,
      witnessCredibility: 'medium',
    },
    metadata: { regionId: 'appalachia', order: 1, isCapstone: false },
  }),
];

export const sampleRegions: Region[] = [
  {
    id: 'pnw',
    name: 'The Pacific Northwest',
    tagline: 'Where the trees watch',
    tint: colors.region.pnw,
    puzzles: samplePuzzles,
    totalPuzzles: samplePuzzles.length,
    isFree: true,
  },
  {
    id: 'appalachia',
    name: 'Appalachia',
    tagline: 'The old roads remember',
    tint: colors.region.appalachia,
    puzzles: appalachiaPuzzles,
    totalPuzzles: appalachiaPuzzles.length,
    isFree: false,
    iapProductId: 'region.appalachia',
  },
];

export function getSampleRegion(id: string): Region | undefined {
  return sampleRegions.find((r) => r.id === id);
}
```
Note: the Appalachia grid must also be uniquely solvable (the test asserts `isUnique` for every region puzzle). If `buildPuzzle` reports it non-unique, swap for a unique 5×5 shape — do not weaken the test.

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- sampleRegions && npx tsc --noEmit` → PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(content): add sampleRegions (free PNW + locked Appalachia)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: RegionsScreen component

Lists the regions as `RegionCard`s with lock + progress from the stores. (SCREEN_SPECS.md Screen 3)

**Files:**
- Create: `src/components/screens/RegionsScreen.tsx`
- Modify: `src/components/screens/index.ts`
- Test: `src/components/screens/__tests__/RegionsScreen.test.tsx`

**Interfaces:**
- Consumes: `@/theme`; `@/engine` (`Region`); `useProgressStore`, `usePurchaseStore` from `@/state`; `RegionCard` from `@/components/molecules`; `IconButton` from `@/components/atoms`.
- Produces: `RegionsScreen` with props `{ regions: Region[]; onSelectRegion: (id: string) => void; onBack: () => void; testID?: string }`.

- [ ] **Step 1: Write the failing test**

Create `src/components/screens/__tests__/RegionsScreen.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RegionsScreen } from '@/components/screens';
import { sampleRegions } from '@/content/sampleRegions';
import { useProgressStore, usePurchaseStore } from '@/state';

beforeEach(() => {
  useProgressStore.getState().hydrate({ solved: {}, onboardingCompleted: false, firstLaunchAt: 0 });
  usePurchaseStore.getState().hydrate({ ownedRegions: [], ownedPacks: [], lastRestoredAt: null, purchaseHistory: [] });
});

describe('RegionsScreen', () => {
  it('renders each region name', () => {
    render(<RegionsScreen regions={sampleRegions} onSelectRegion={() => {}} onBack={() => {}} testID="regions" />);
    expect(screen.getByText('The Pacific Northwest')).toBeTruthy();
    expect(screen.getByText('Appalachia')).toBeTruthy();
  });

  it('locks a paid, unowned region and leaves the free one unlocked', () => {
    render(<RegionsScreen regions={sampleRegions} onSelectRegion={() => {}} onBack={() => {}} testID="regions" />);
    // pnw is free -> chevron; appalachia is paid+unowned -> lock
    expect(screen.getByTestId('region-appalachia-lock')).toBeTruthy();
    expect(screen.getByTestId('region-pnw-chevron')).toBeTruthy();
  });

  it('unlocks a paid region once owned', () => {
    usePurchaseStore.getState().grantRegion('appalachia');
    render(<RegionsScreen regions={sampleRegions} onSelectRegion={() => {}} onBack={() => {}} testID="regions" />);
    expect(screen.getByTestId('region-appalachia-chevron')).toBeTruthy();
  });

  it('calls onSelectRegion when a region is tapped', () => {
    const onSelectRegion = jest.fn();
    render(<RegionsScreen regions={sampleRegions} onSelectRegion={onSelectRegion} onBack={() => {}} testID="regions" />);
    fireEvent.press(screen.getByTestId('region-pnw'));
    expect(onSelectRegion).toHaveBeenCalledWith('pnw');
  });

  it('calls onBack from the back control', () => {
    const onBack = jest.fn();
    render(<RegionsScreen regions={sampleRegions} onSelectRegion={() => {}} onBack={onBack} testID="regions" />);
    fireEvent.press(screen.getByTestId('regions-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- RegionsScreen` → FAIL.

- [ ] **Step 3: Implement**

Create `src/components/screens/RegionsScreen.tsx`:
```tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { colors, typography, spacing } from '@/theme';
import { Region } from '@/engine';
import { useProgressStore, usePurchaseStore } from '@/state';
import { IconButton } from '@/components/atoms';
import { RegionCard } from '@/components/molecules';

export interface RegionsScreenProps {
  regions: Region[];
  onSelectRegion: (id: string) => void;
  onBack: () => void;
  testID?: string;
}

export function RegionsScreen({ regions, onSelectRegion, onBack, testID }: RegionsScreenProps) {
  const solved = useProgressStore((s) => s.solved);
  const ownsRegion = usePurchaseStore((s) => s.ownsRegion);

  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: colors.paper.cream, padding: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton icon="back" variant="ghost" accessibilityLabel="Back" onPress={onBack} testID="regions-back" />
      </View>
      <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.xl, letterSpacing: typography.letterSpacing.wider, color: colors.ink.primary, textTransform: 'uppercase', marginTop: spacing.sm }}>
        Expeditions
      </Text>
      <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: typography.size.sm, color: colors.ink.faded, marginBottom: spacing.md }}>
        Choose a region to investigate.
      </Text>
      <ScrollView>
        {regions.map((region) => {
          const solvedCount = region.puzzles.filter((p) => solved[p.id] !== undefined).length;
          const isLocked = !region.isFree && !ownsRegion(region.id);
          return (
            <RegionCard
              key={region.id}
              region={region}
              progress={{ solved: solvedCount, total: region.totalPuzzles }}
              isLocked={isLocked}
              isComingSoon={false}
              onPress={() => onSelectRegion(region.id)}
              testID={`region-${region.id}`}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

export default RegionsScreen;
```
Add to `src/components/screens/index.ts`:
```typescript
export { RegionsScreen, default as RegionsScreenDefault } from './RegionsScreen';
export type { RegionsScreenProps } from './RegionsScreen';
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- RegionsScreen && npx tsc --noEmit` → PASS (5), exit 0.

Note: `RegionCard` renders its Feather icon with `testID={`${testID}-lock`}` (locked/coming-soon) or `testID={`${testID}-chevron`}` (unlocked). With `testID="region-pnw"` this yields `region-pnw-chevron` / `region-appalachia-lock`, matching the test.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(screens): add RegionsScreen

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: PuzzleListScreen component

Lists a region's puzzles as `PuzzleCard`s with solved/best-time state. (SCREEN_SPECS.md Screen 4)

**Files:**
- Create: `src/components/screens/PuzzleListScreen.tsx`
- Modify: `src/components/screens/index.ts`
- Test: `src/components/screens/__tests__/PuzzleListScreen.test.tsx`

**Interfaces:**
- Consumes: `@/theme`; `@/engine` (`Region`); `useProgressStore` from `@/state`; `PuzzleCard` from `@/components/molecules`; `IconButton` from `@/components/atoms`.
- Produces: `PuzzleListScreen` with props `{ region: Region; onSelectPuzzle: (id: string) => void; onBack: () => void; testID?: string }`.

- [ ] **Step 1: Write the failing test**

Create `src/components/screens/__tests__/PuzzleListScreen.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PuzzleListScreen } from '@/components/screens';
import { getSampleRegion } from '@/content/sampleRegions';
import { useProgressStore } from '@/state';
import type { Region } from '@/engine';

const PNW = getSampleRegion('pnw') as Region;

beforeEach(() => {
  useProgressStore.getState().hydrate({ solved: {}, onboardingCompleted: false, firstLaunchAt: 0 });
});

describe('PuzzleListScreen', () => {
  it('renders the region name and hides unsolved puzzle names as ???', () => {
    render(<PuzzleListScreen region={PNW} onSelectPuzzle={() => {}} onBack={() => {}} testID="list" />);
    expect(screen.getByText('The Pacific Northwest')).toBeTruthy();
    expect(screen.getAllByText('???').length).toBe(PNW.puzzles.length);
  });

  it('reveals a puzzle name once it is solved', () => {
    const first = PNW.puzzles[0];
    useProgressStore.getState().markSolved(first.id, { time: 42, mistakes: 0 });
    render(<PuzzleListScreen region={PNW} onSelectPuzzle={() => {}} onBack={() => {}} testID="list" />);
    expect(screen.getByText(first.name)).toBeTruthy();
  });

  it('calls onSelectPuzzle when a card is tapped', () => {
    const onSelectPuzzle = jest.fn();
    render(<PuzzleListScreen region={PNW} onSelectPuzzle={onSelectPuzzle} onBack={() => {}} testID="list" />);
    fireEvent.press(screen.getByTestId(`puzzle-${PNW.puzzles[0].id}`));
    expect(onSelectPuzzle).toHaveBeenCalledWith(PNW.puzzles[0].id);
  });

  it('calls onBack from the back control', () => {
    const onBack = jest.fn();
    render(<PuzzleListScreen region={PNW} onSelectPuzzle={() => {}} onBack={onBack} testID="list" />);
    fireEvent.press(screen.getByTestId('list-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- PuzzleListScreen` → FAIL.

- [ ] **Step 3: Implement**

Create `src/components/screens/PuzzleListScreen.tsx`:
```tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { colors, typography, spacing } from '@/theme';
import { Region } from '@/engine';
import { useProgressStore } from '@/state';
import { IconButton } from '@/components/atoms';
import { PuzzleCard } from '@/components/molecules';

export interface PuzzleListScreenProps {
  region: Region;
  onSelectPuzzle: (id: string) => void;
  onBack: () => void;
  testID?: string;
}

export function PuzzleListScreen({ region, onSelectPuzzle, onBack, testID }: PuzzleListScreenProps) {
  const solved = useProgressStore((s) => s.solved);

  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: colors.paper.cream, padding: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton icon="back" variant="ghost" accessibilityLabel="Back" onPress={onBack} testID="list-back" />
      </View>
      <Text style={{ fontFamily: typography.fontFamily.display, fontSize: typography.size.xl, letterSpacing: typography.letterSpacing.wide, color: colors.ink.primary, marginTop: spacing.sm }}>
        {region.name}
      </Text>
      <Text style={{ fontFamily: typography.fontFamily.bodyItalic, fontStyle: 'italic', fontSize: typography.size.sm, color: colors.ink.faded, marginBottom: spacing.md }}>
        {region.tagline}
      </Text>
      <ScrollView>
        {region.puzzles.map((p) => {
          const entry = solved[p.id];
          const isSolved = entry !== undefined;
          const cols = p.grid[0]?.length ?? 0;
          const rows = p.grid.length;
          return (
            <PuzzleCard
              key={p.id}
              puzzleNumber={p.metadata.order}
              puzzleName={isSolved ? p.name : '???'}
              size={`${cols}x${rows}`}
              tier={p.difficulty.tier}
              isSolved={isSolved}
              bestTime={entry?.time}
              bestMistakes={entry?.mistakes}
              onPress={() => onSelectPuzzle(p.id)}
              testID={`puzzle-${p.id}`}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

export default PuzzleListScreen;
```
Add to `src/components/screens/index.ts`:
```typescript
export { PuzzleListScreen, default as PuzzleListScreenDefault } from './PuzzleListScreen';
export type { PuzzleListScreenProps } from './PuzzleListScreen';
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- PuzzleListScreen && npx tsc --noEmit` → PASS (4), exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(screens): add PuzzleListScreen

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Routes + Home entry (Home → Regions → List → Puzzle)

Wire the two screens into Expo Router and point Home at Regions. (SCREEN_SPECS.md Screens 3–4 routing)

**Files:**
- Create: `src/app/regions.tsx`
- Create: `src/app/region/[id].tsx`
- Modify: `src/app/index.tsx` (point the Home entry at `/regions`)

**Interfaces:**
- Consumes: `expo-router`; `sampleRegions`/`getSampleRegion` from `@/content/sampleRegions`; `RegionsScreen`/`PuzzleListScreen` from `@/components/screens`.
- Produces: `/regions` and `/region/[id]` routes; Home navigates to `/regions`.

- [ ] **Step 1: Create the regions route**

Create `src/app/regions.tsx`:
```tsx
import React from 'react';
import { useRouter } from 'expo-router';
import { sampleRegions } from '@/content/sampleRegions';
import { RegionsScreen } from '@/components/screens';

export default function RegionsRoute() {
  const router = useRouter();
  return (
    <RegionsScreen
      regions={sampleRegions}
      onSelectRegion={(id) => router.push(`/region/${id}`)}
      onBack={() => router.back()}
    />
  );
}
```

- [ ] **Step 2: Create the region puzzle-list route**

Create `src/app/region/[id].tsx`:
```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, typography, spacing } from '@/theme';
import { getSampleRegion } from '@/content/sampleRegions';
import { PuzzleListScreen } from '@/components/screens';

export default function RegionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const region = typeof id === 'string' ? getSampleRegion(id) : undefined;

  if (!region) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper.cream, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
        <Text style={{ fontFamily: typography.fontFamily.body, color: colors.ink.soft, textAlign: 'center' }}>
          That region could not be found.
        </Text>
      </View>
    );
  }

  return (
    <PuzzleListScreen
      region={region}
      onSelectPuzzle={(pid) => router.push(`/puzzle/${pid}`)}
      onBack={() => router.back()}
    />
  );
}
```

- [ ] **Step 3: Point Home at Regions**

Modify `src/app/index.tsx`: change the existing `home-play-sample` Pressable so it navigates to `/regions` instead of a single puzzle, and update its label. Change the `onPress` to `() => router.push('/regions')` and the text to `open the field guide`. Keep everything else (the existing content, styles, and the `useRouter` import already present from the prior task).

- [ ] **Step 4: Full suite + typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: entire suite green, tsc exit 0.

- [ ] **Step 5: Runnable check (headless bundle)**

Run:
```bash
rm -rf /tmp/cp-regions-export && npx expo export --platform ios --output-dir /tmp/cp-regions-export >/tmp/cp-regions.log 2>&1; echo "export exit: $?"
```
Expected: `export exit: 0` (all routes bundle; Home → Regions → List → Puzzle → Reveal is wired). If it fails, read `/tmp/cp-regions.log`.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(app): add /regions + /region/[id] routes, Home opens the field guide

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes for the executor

- Sample content is a stand-in; the Appalachia grid must be uniquely solvable (the test asserts it) — swap if `buildPuzzle` disagrees.
- Screens read `progressStore`/`purchaseStore` directly (like `PuzzlePlayScreen` reads `uiStore`); routes pass region data + nav callbacks.
- Locked-region behavior for now is just navigation via `onSelectRegion`; the Paywall modal is a later plan — tapping a locked region still routes to its (empty-if-unowned) list. Gating navigation on lock is a small later enhancement.
- The full loop after this: Home → Regions → Puzzle List → Puzzle → Reveal → Home.
- WorldMap organism (pinch/pan map) is a later visual upgrade to RegionsScreen; the list view here is the accessible fallback the spec also requires.
