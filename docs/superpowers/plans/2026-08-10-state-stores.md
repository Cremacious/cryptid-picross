# State Stores + Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the persisted app-state layer per DATA_AND_ENGINE.md §3 — a single versioned save object in AsyncStorage, a persistence module (load with corruption backup + default, write), and the three persisted Zustand stores (`settings`, `progress`, `purchase`) wired to save through a `saveManager`.

**Architecture:** All persistent data lives under ONE AsyncStorage key as a versioned `SaveStateV1` (progress + settings + purchases). The stores are plain Zustand stores holding their slice; each mutating action calls a decoupled `notifyChange()` (via a tiny `saveBus` to avoid import cycles). A `saveManager` registers the real persist handler, assembles the full `SaveStateV1` from all stores, and writes it (coalesced). On boot, `initSaveSystem()` loads the save, hydrates every store, and wires the handler. The ephemeral gameplay store (`uiStore`) is a SEPARATE later plan — not built here.

**Tech Stack:** TypeScript, Zustand, `@react-native-async-storage/async-storage`, Jest (`jest-expo`). Reuses domain types from `@/engine`.

## Global Constraints

- All persistent data lives under the SINGLE key `@picross-cryptozoology/save/v1` as a `SaveStateV1` (version + savedAt + progress + settings + purchases). No per-store keys. (DATA_AND_ENGINE.md §3.1)
- Corruption handling: on unparseable JSON, back up the raw string to `@picross-cryptozoology/save/corrupt/{timestamp}`, reset to default, signal recovery — NEVER lose data silently, NEVER crash. (DATA_AND_ENGINE.md §3.4)
- `markSolved` preserves the BEST time — it never overwrites a better prior time, and records the mistakes of the best run. (QA_AND_LAUNCH.md §1.4; DATA_AND_ENGINE.md §3.1)
- Stores never call AsyncStorage/IAP directly — persistence goes through the saveManager/persistence module. (COMPONENT_LIBRARY.md Part 6)
- Store shapes mirror the save schema exactly: `SettingsStateV1`, `ProgressStateV1`, `PurchaseStateV1` (DATA_AND_ENGINE.md §3.1).
- Default settings: `mode:'cozy'`, sound/haptics `true`, `reduceMotion:false`, both volumes `1`. (inferred defaults; cozy is the friendly default per SCREEN_SPECS Settings)
- Engine coverage target does not apply here, but state stores target ≥90% statements/functions/lines, ≥85% branches. (QA_AND_LAUNCH.md §1.2)
- Zustand stores are module singletons — tests MUST reset store state in `beforeEach` (via `setState`/`hydrate`) to stay isolated.
- Every commit message ends with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Project root: `/home/chris/Code/cryptid-picross`.

---

### Task 1: Dependencies + save-state schema

Install Zustand + AsyncStorage and define the versioned save types.

**Files:**
- Modify: `package.json` (deps)
- Create: `src/state/saveTypes.ts`
- Test: `src/state/__tests__/saveTypes.test.ts`

**Interfaces:**
- Produces: `SaveStateV1`, `SolvedEntry`, `ProgressStateV1`, `SettingsStateV1`, `PurchaseStateV1` — consumed by every later task.

- [ ] **Step 1: Install dependencies**

Run:
```bash
cd /home/chris/Code/cryptid-picross
npm install zustand
npx expo install @react-native-async-storage/async-storage
```

- [ ] **Step 2: Write the failing compile-time test**

Create `src/state/__tests__/saveTypes.test.ts`:
```typescript
import type {
  SaveStateV1, SolvedEntry, ProgressStateV1, SettingsStateV1, PurchaseStateV1,
} from '@/state/saveTypes';

describe('save-state schema', () => {
  it('composes into a valid v1 save object', () => {
    const solved: SolvedEntry = { time: 42, mistakes: 1, solvedAt: 1, lastPlayedAt: 2, playCount: 3 };
    const progress: ProgressStateV1 = { solved: { 'pnw-001': solved }, onboardingCompleted: true, firstLaunchAt: 0 };
    const settings: SettingsStateV1 = {
      mode: 'cozy', soundEnabled: true, hapticsEnabled: true,
      reduceMotion: false, ambientAudioVolume: 1, effectsAudioVolume: 1,
    };
    const purchases: PurchaseStateV1 = {
      ownedRegions: ['pnw'], ownedPacks: [], lastRestoredAt: null,
      purchaseHistory: [{ productId: 'pnw', purchasedAt: 10 }],
    };
    const save: SaveStateV1 = { version: 1, savedAt: 99, progress, settings, purchases };
    expect(save.version).toBe(1);
    expect(save.progress.solved['pnw-001'].time).toBe(42);
    expect(save.settings.mode).toBe('cozy');
    expect(save.purchases.ownedRegions[0]).toBe('pnw');
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm test -- saveTypes` → FAIL (no module).

- [ ] **Step 4: Create the types**

Create `src/state/saveTypes.ts`:
```typescript
export interface SolvedEntry {
  time: number; // best solve time in seconds
  mistakes: number; // wrong fills on the best run
  solvedAt: number; // Unix ms of first solve
  lastPlayedAt: number; // Unix ms of most recent play
  playCount: number; // total times solved
}

export interface ProgressStateV1 {
  solved: Record<string, SolvedEntry>; // key = puzzle id
  onboardingCompleted: boolean;
  firstLaunchAt: number;
}

export interface SettingsStateV1 {
  mode: 'cozy' | 'classic';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  reduceMotion: boolean;
  ambientAudioVolume: number; // 0..1
  effectsAudioVolume: number; // 0..1
}

export interface PurchaseHistoryEntry {
  productId: string;
  purchasedAt: number;
  price?: string;
}

export interface PurchaseStateV1 {
  ownedRegions: string[];
  ownedPacks: string[];
  lastRestoredAt: number | null;
  purchaseHistory: PurchaseHistoryEntry[];
}

export interface SaveStateV1 {
  version: 1;
  savedAt: number; // Unix ms
  progress: ProgressStateV1;
  settings: SettingsStateV1;
  purchases: PurchaseStateV1;
}
```

- [ ] **Step 5: Run to verify it passes + typecheck**

Run: `npm test -- saveTypes && npx tsc --noEmit` → PASS, exit 0.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(state): add save-state schema + deps

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Persistence module

Load/write the single save object, with default creation and corruption backup+recovery. (DATA_AND_ENGINE.md §3.1–3.4)

**Files:**
- Create: `src/state/persistence.ts`
- Test: `src/state/__tests__/persistence.test.ts`

**Interfaces:**
- Consumes: `SaveStateV1` from `./saveTypes`; `@react-native-async-storage/async-storage`.
- Produces:
  - `SAVE_KEY: string`
  - `createDefaultSaveState(now?: number): SaveStateV1`
  - `loadSaveState(): Promise<{ state: SaveStateV1; recovered: boolean }>`
  - `writeSaveState(state: SaveStateV1): Promise<void>`

- [ ] **Step 1: Write the failing test**

Create `src/state/__tests__/persistence.test.ts`:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SAVE_KEY, createDefaultSaveState, loadSaveState, writeSaveState } from '@/state/persistence';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('persistence', () => {
  it('returns a default save when storage is empty (not recovered)', async () => {
    const { state, recovered } = await loadSaveState();
    expect(recovered).toBe(false);
    expect(state.version).toBe(1);
    expect(state.settings.mode).toBe('cozy');
    expect(state.progress.solved).toEqual({});
    expect(state.purchases.ownedRegions).toEqual([]);
  });

  it('round-trips a written save', async () => {
    const save = createDefaultSaveState(123);
    save.settings.mode = 'classic';
    save.progress.solved['p1'] = { time: 30, mistakes: 0, solvedAt: 1, lastPlayedAt: 1, playCount: 1 };
    await writeSaveState(save);
    const { state, recovered } = await loadSaveState();
    expect(recovered).toBe(false);
    expect(state.settings.mode).toBe('classic');
    expect(state.progress.solved['p1'].time).toBe(30);
  });

  it('recovers from corrupt JSON: backs it up, resets to default, flags recovery', async () => {
    await AsyncStorage.setItem(SAVE_KEY, '{ this is not valid json');
    const { state, recovered } = await loadSaveState();
    expect(recovered).toBe(true);
    expect(state.progress.solved).toEqual({}); // reset to default
    const keys = await AsyncStorage.getAllKeys();
    expect(keys.some((k) => k.startsWith('@picross-cryptozoology/save/corrupt/'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- persistence` → FAIL.

- [ ] **Step 3: Implement**

Create `src/state/persistence.ts`:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SaveStateV1 } from './saveTypes';

export const SAVE_KEY = '@picross-cryptozoology/save/v1';
const CORRUPT_PREFIX = '@picross-cryptozoology/save/corrupt/';

export function createDefaultSaveState(now: number = Date.now()): SaveStateV1 {
  return {
    version: 1,
    savedAt: now,
    progress: { solved: {}, onboardingCompleted: false, firstLaunchAt: now },
    settings: {
      mode: 'cozy',
      soundEnabled: true,
      hapticsEnabled: true,
      reduceMotion: false,
      ambientAudioVolume: 1,
      effectsAudioVolume: 1,
    },
    purchases: { ownedRegions: [], ownedPacks: [], lastRestoredAt: null, purchaseHistory: [] },
  };
}

/**
 * Load the save. Empty storage -> fresh default. Corrupt JSON -> back up the
 * bad string, return a default, and flag recovery so the UI can apologize.
 * (Future save versions migrate here before returning.)
 */
export async function loadSaveState(): Promise<{ state: SaveStateV1; recovered: boolean }> {
  const raw = await AsyncStorage.getItem(SAVE_KEY);
  if (raw == null) return { state: createDefaultSaveState(), recovered: false };
  try {
    const parsed = JSON.parse(raw) as SaveStateV1;
    return { state: parsed, recovered: false };
  } catch {
    try {
      await AsyncStorage.setItem(CORRUPT_PREFIX + String(Date.now()), raw);
    } catch {
      // best-effort backup; never throw from load
    }
    return { state: createDefaultSaveState(), recovered: true };
  }
}

export async function writeSaveState(state: SaveStateV1): Promise<void> {
  const toWrite: SaveStateV1 = { ...state, savedAt: Date.now() };
  await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(toWrite));
}
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- persistence && npx tsc --noEmit` → PASS (3 tests), exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(state): add persistence module with corruption recovery

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: saveBus + settingsStore

A tiny decoupling bus (breaks the store↔saveManager import cycle) and the settings store. (COMPONENT_LIBRARY.md 3.4; QA_AND_LAUNCH.md §1.4)

**Files:**
- Create: `src/state/saveBus.ts`
- Create: `src/state/settingsStore.ts`
- Test: `src/state/__tests__/settingsStore.test.ts`

**Interfaces:**
- Consumes: `SettingsStateV1` from `./saveTypes`; `zustand`.
- Produces:
  - `saveBus`: `setChangeHandler(fn: () => void): void`, `notifyChange(): void`
  - `useSettingsStore` (Zustand) with state = `SettingsStateV1` + actions: `setMode`, `setSoundEnabled`, `setHapticsEnabled`, `setReduceMotion`, `setAmbientVolume`, `setEffectsVolume`, `hydrate(s: SettingsStateV1)`.

- [ ] **Step 1: Write the failing test**

Create `src/state/__tests__/settingsStore.test.ts`:
```typescript
import { useSettingsStore } from '@/state/settingsStore';
import { notifyChange } from '@/state/saveBus';

jest.mock('@/state/saveBus', () => ({
  notifyChange: jest.fn(),
  setChangeHandler: jest.fn(),
}));

beforeEach(() => {
  (notifyChange as jest.Mock).mockClear();
  useSettingsStore.getState().hydrate({
    mode: 'cozy', soundEnabled: true, hapticsEnabled: true,
    reduceMotion: false, ambientAudioVolume: 1, effectsAudioVolume: 1,
  });
});

describe('settingsStore', () => {
  it('setMode updates state and notifies for persistence', () => {
    useSettingsStore.getState().setMode('classic');
    expect(useSettingsStore.getState().mode).toBe('classic');
    expect(notifyChange).toHaveBeenCalledTimes(1);
  });

  it('toggles sound, haptics, and reduce-motion', () => {
    useSettingsStore.getState().setSoundEnabled(false);
    useSettingsStore.getState().setHapticsEnabled(false);
    useSettingsStore.getState().setReduceMotion(true);
    const s = useSettingsStore.getState();
    expect(s.soundEnabled).toBe(false);
    expect(s.hapticsEnabled).toBe(false);
    expect(s.reduceMotion).toBe(true);
  });

  it('sets volumes and hydrates from a save slice', () => {
    useSettingsStore.getState().setAmbientVolume(0.5);
    useSettingsStore.getState().setEffectsVolume(0.25);
    expect(useSettingsStore.getState().ambientAudioVolume).toBe(0.5);
    expect(useSettingsStore.getState().effectsAudioVolume).toBe(0.25);
    useSettingsStore.getState().hydrate({
      mode: 'classic', soundEnabled: false, hapticsEnabled: false,
      reduceMotion: true, ambientAudioVolume: 0, effectsAudioVolume: 0,
    });
    expect(useSettingsStore.getState().mode).toBe('classic');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- settingsStore` → FAIL.

- [ ] **Step 3: Implement**

Create `src/state/saveBus.ts`:
```typescript
/**
 * Decouples stores from the saveManager. Stores call notifyChange() after a
 * mutation; saveManager registers the real persist handler via setChangeHandler.
 * This one-way indirection avoids a store <-> saveManager import cycle.
 */
type ChangeHandler = () => void;

let handler: ChangeHandler = () => {};

export function setChangeHandler(fn: ChangeHandler): void {
  handler = fn;
}

export function notifyChange(): void {
  handler();
}
```

Create `src/state/settingsStore.ts`:
```typescript
import { create } from 'zustand';
import { SettingsStateV1 } from './saveTypes';
import { notifyChange } from './saveBus';

interface SettingsStore extends SettingsStateV1 {
  setMode: (mode: 'cozy' | 'classic') => void;
  setSoundEnabled: (v: boolean) => void;
  setHapticsEnabled: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setAmbientVolume: (v: number) => void;
  setEffectsVolume: (v: number) => void;
  hydrate: (s: SettingsStateV1) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  mode: 'cozy',
  soundEnabled: true,
  hapticsEnabled: true,
  reduceMotion: false,
  ambientAudioVolume: 1,
  effectsAudioVolume: 1,
  setMode: (mode) => { set({ mode }); notifyChange(); },
  setSoundEnabled: (soundEnabled) => { set({ soundEnabled }); notifyChange(); },
  setHapticsEnabled: (hapticsEnabled) => { set({ hapticsEnabled }); notifyChange(); },
  setReduceMotion: (reduceMotion) => { set({ reduceMotion }); notifyChange(); },
  setAmbientVolume: (ambientAudioVolume) => { set({ ambientAudioVolume }); notifyChange(); },
  setEffectsVolume: (effectsAudioVolume) => { set({ effectsAudioVolume }); notifyChange(); },
  hydrate: (s) => set({ ...s }),
}));
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- settingsStore && npx tsc --noEmit` → PASS (3 tests), exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(state): add saveBus + settingsStore

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: progressStore

Tracks solved puzzles (best-time preserving), onboarding, first-launch. (QA_AND_LAUNCH.md §1.4; DATA_AND_ENGINE.md §3.1)

**Files:**
- Create: `src/state/progressStore.ts`
- Test: `src/state/__tests__/progressStore.test.ts`

**Interfaces:**
- Consumes: `ProgressStateV1`, `SolvedEntry` from `./saveTypes`; `notifyChange` from `./saveBus`.
- Produces: `useProgressStore` with state = `ProgressStateV1` + actions: `markSolved(id, {time, mistakes})`, `isSolved(id): boolean`, `getEntry(id): SolvedEntry | undefined`, `setOnboardingCompleted(v)`, `clearAll()`, `hydrate(s)`.

- [ ] **Step 1: Write the failing test**

Create `src/state/__tests__/progressStore.test.ts`:
```typescript
import { useProgressStore } from '@/state/progressStore';
import { notifyChange } from '@/state/saveBus';

jest.mock('@/state/saveBus', () => ({
  notifyChange: jest.fn(),
  setChangeHandler: jest.fn(),
}));

beforeEach(() => {
  (notifyChange as jest.Mock).mockClear();
  useProgressStore.getState().hydrate({ solved: {}, onboardingCompleted: false, firstLaunchAt: 0 });
});

describe('progressStore', () => {
  it('markSolved records time, mistakes, and playCount, and notifies', () => {
    useProgressStore.getState().markSolved('p1', { time: 100, mistakes: 2 });
    const e = useProgressStore.getState().getEntry('p1');
    expect(e?.time).toBe(100);
    expect(e?.mistakes).toBe(2);
    expect(e?.playCount).toBe(1);
    expect(notifyChange).toHaveBeenCalled();
  });

  it('preserves the best time and its mistakes across replays', () => {
    const p = useProgressStore.getState();
    p.markSolved('p1', { time: 100, mistakes: 5 });
    p.markSolved('p1', { time: 60, mistakes: 1 }); // new best
    p.markSolved('p1', { time: 80, mistakes: 0 }); // worse -> ignored for time/mistakes
    const e = useProgressStore.getState().getEntry('p1');
    expect(e?.time).toBe(60);
    expect(e?.mistakes).toBe(1);
    expect(e?.playCount).toBe(3);
  });

  it('isSolved reflects whether an id has an entry', () => {
    expect(useProgressStore.getState().isSolved('p1')).toBe(false);
    useProgressStore.getState().markSolved('p1', { time: 10, mistakes: 0 });
    expect(useProgressStore.getState().isSolved('p1')).toBe(true);
  });

  it('sets onboarding and clears all progress', () => {
    const p = useProgressStore.getState();
    p.setOnboardingCompleted(true);
    p.markSolved('p1', { time: 10, mistakes: 0 });
    p.clearAll();
    expect(useProgressStore.getState().isSolved('p1')).toBe(false);
    expect(useProgressStore.getState().onboardingCompleted).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- progressStore` → FAIL.

- [ ] **Step 3: Implement**

Create `src/state/progressStore.ts`:
```typescript
import { create } from 'zustand';
import { ProgressStateV1, SolvedEntry } from './saveTypes';
import { notifyChange } from './saveBus';

interface ProgressStore extends ProgressStateV1 {
  markSolved: (id: string, result: { time: number; mistakes: number }) => void;
  isSolved: (id: string) => boolean;
  getEntry: (id: string) => SolvedEntry | undefined;
  setOnboardingCompleted: (v: boolean) => void;
  clearAll: () => void;
  hydrate: (s: ProgressStateV1) => void;
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  solved: {},
  onboardingCompleted: false,
  firstLaunchAt: Date.now(),
  markSolved: (id, result) => {
    const now = Date.now();
    const prev = get().solved[id];
    const isNewBest = !prev || result.time < prev.time;
    const entry: SolvedEntry = prev
      ? {
          time: Math.min(prev.time, result.time),
          mistakes: isNewBest ? result.mistakes : prev.mistakes,
          solvedAt: prev.solvedAt,
          lastPlayedAt: now,
          playCount: prev.playCount + 1,
        }
      : { time: result.time, mistakes: result.mistakes, solvedAt: now, lastPlayedAt: now, playCount: 1 };
    set({ solved: { ...get().solved, [id]: entry } });
    notifyChange();
  },
  isSolved: (id) => get().solved[id] !== undefined,
  getEntry: (id) => get().solved[id],
  setOnboardingCompleted: (onboardingCompleted) => { set({ onboardingCompleted }); notifyChange(); },
  clearAll: () => { set({ solved: {}, onboardingCompleted: false }); notifyChange(); },
  hydrate: (s) => set({ ...s }),
}));
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- progressStore && npx tsc --noEmit` → PASS (4 tests), exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(state): add progressStore

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: purchaseStore

Tracks owned regions/packs and restore. RevenueCat integration is a later concern; these actions are the local state it will drive. (QA_AND_LAUNCH.md §1.4; DATA_AND_ENGINE.md §3.1)

**Files:**
- Create: `src/state/purchaseStore.ts`
- Test: `src/state/__tests__/purchaseStore.test.ts`

**Interfaces:**
- Consumes: `PurchaseStateV1` from `./saveTypes`; `notifyChange` from `./saveBus`.
- Produces: `usePurchaseStore` with state = `PurchaseStateV1` + actions: `ownsRegion(id): boolean`, `grantRegion(id, price?)`, `grantPack(id, price?)`, `restore(regions, packs?)`, `clearAll()`, `hydrate(s)`.

- [ ] **Step 1: Write the failing test**

Create `src/state/__tests__/purchaseStore.test.ts`:
```typescript
import { usePurchaseStore } from '@/state/purchaseStore';
import { notifyChange } from '@/state/saveBus';

jest.mock('@/state/saveBus', () => ({
  notifyChange: jest.fn(),
  setChangeHandler: jest.fn(),
}));

beforeEach(() => {
  (notifyChange as jest.Mock).mockClear();
  usePurchaseStore.getState().hydrate({
    ownedRegions: [], ownedPacks: [], lastRestoredAt: null, purchaseHistory: [],
  });
});

describe('purchaseStore', () => {
  it('grants a region, records history, and reports ownership', () => {
    usePurchaseStore.getState().grantRegion('pnw', '$2.99');
    expect(usePurchaseStore.getState().ownsRegion('pnw')).toBe(true);
    expect(usePurchaseStore.getState().purchaseHistory).toHaveLength(1);
    expect(notifyChange).toHaveBeenCalled();
  });

  it('is idempotent — granting the same region twice does not duplicate', () => {
    usePurchaseStore.getState().grantRegion('pnw');
    usePurchaseStore.getState().grantRegion('pnw');
    expect(usePurchaseStore.getState().ownedRegions).toEqual(['pnw']);
  });

  it('restore sets owned regions/packs and lastRestoredAt', () => {
    usePurchaseStore.getState().restore(['pnw', 'appalachia', 'pnw'], ['halloween']);
    const s = usePurchaseStore.getState();
    expect(s.ownedRegions.sort()).toEqual(['appalachia', 'pnw']);
    expect(s.ownedPacks).toEqual(['halloween']);
    expect(typeof s.lastRestoredAt).toBe('number');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- purchaseStore` → FAIL.

- [ ] **Step 3: Implement**

Create `src/state/purchaseStore.ts`:
```typescript
import { create } from 'zustand';
import { PurchaseStateV1 } from './saveTypes';
import { notifyChange } from './saveBus';

interface PurchaseStore extends PurchaseStateV1 {
  ownsRegion: (id: string) => boolean;
  grantRegion: (id: string, price?: string) => void;
  grantPack: (id: string, price?: string) => void;
  restore: (regions: string[], packs?: string[]) => void;
  clearAll: () => void;
  hydrate: (s: PurchaseStateV1) => void;
}

export const usePurchaseStore = create<PurchaseStore>((set, get) => ({
  ownedRegions: [],
  ownedPacks: [],
  lastRestoredAt: null,
  purchaseHistory: [],
  ownsRegion: (id) => get().ownedRegions.includes(id),
  grantRegion: (id, price) => {
    if (get().ownedRegions.includes(id)) return;
    set({
      ownedRegions: [...get().ownedRegions, id],
      purchaseHistory: [...get().purchaseHistory, { productId: id, purchasedAt: Date.now(), price }],
    });
    notifyChange();
  },
  grantPack: (id, price) => {
    if (get().ownedPacks.includes(id)) return;
    set({
      ownedPacks: [...get().ownedPacks, id],
      purchaseHistory: [...get().purchaseHistory, { productId: id, purchasedAt: Date.now(), price }],
    });
    notifyChange();
  },
  restore: (regions, packs = []) => {
    set({
      ownedRegions: Array.from(new Set(regions)),
      ownedPacks: Array.from(new Set(packs)),
      lastRestoredAt: Date.now(),
    });
    notifyChange();
  },
  clearAll: () => {
    set({ ownedRegions: [], ownedPacks: [], lastRestoredAt: null, purchaseHistory: [] });
    notifyChange();
  },
  hydrate: (s) => set({ ...s }),
}));
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- purchaseStore && npx tsc --noEmit` → PASS (3 tests), exit 0.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(state): add purchaseStore

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: saveManager + barrel + round-trip integration

Wire it together: assemble/hydrate the full save from all stores, coalesce writes, and boot the system. Prove the whole round-trip end to end. (DATA_AND_ENGINE.md §3)

**Files:**
- Create: `src/state/saveManager.ts`
- Create: `src/state/index.ts`
- Test: `src/state/__tests__/saveManager.test.ts`

**Interfaces:**
- Consumes: `loadSaveState`, `writeSaveState` from `./persistence`; `setChangeHandler` from `./saveBus`; the three stores; `SaveStateV1` from `./saveTypes`.
- Produces:
  - `collectSaveState(): SaveStateV1`
  - `hydrateFromSave(save: SaveStateV1): void`
  - `persist(): Promise<void>` (coalesced — never loses the last change, never overlaps)
  - `initSaveSystem(): Promise<{ state: SaveStateV1; recovered: boolean }>`
  - `src/state/index.ts` barrel re-exporting the stores, saveManager, persistence, and types.

- [ ] **Step 1: Write the failing test**

Create `src/state/__tests__/saveManager.test.ts`:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initSaveSystem, persist, collectSaveState } from '@/state/saveManager';
import { loadSaveState } from '@/state/persistence';
import { useSettingsStore } from '@/state/settingsStore';
import { useProgressStore } from '@/state/progressStore';
import { usePurchaseStore } from '@/state/purchaseStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  await AsyncStorage.clear();
  useSettingsStore.getState().hydrate({
    mode: 'cozy', soundEnabled: true, hapticsEnabled: true,
    reduceMotion: false, ambientAudioVolume: 1, effectsAudioVolume: 1,
  });
  useProgressStore.getState().hydrate({ solved: {}, onboardingCompleted: false, firstLaunchAt: 0 });
  usePurchaseStore.getState().hydrate({ ownedRegions: [], ownedPacks: [], lastRestoredAt: null, purchaseHistory: [] });
});

describe('saveManager', () => {
  it('collectSaveState reflects the live store state', () => {
    useSettingsStore.getState().setMode('classic');
    const save = collectSaveState();
    expect(save.version).toBe(1);
    expect(save.settings.mode).toBe('classic');
  });

  it('persists store changes and reloads them (full round-trip)', async () => {
    await initSaveSystem(); // registers the change handler, hydrates default
    useSettingsStore.getState().setMode('classic');
    useProgressStore.getState().markSolved('pnw-001', { time: 42, mistakes: 1 });
    usePurchaseStore.getState().grantRegion('pnw');
    await persist(); // deterministic flush

    const { state } = await loadSaveState();
    expect(state.settings.mode).toBe('classic');
    expect(state.progress.solved['pnw-001'].time).toBe(42);
    expect(state.purchases.ownedRegions).toContain('pnw');
  });

  it('initSaveSystem hydrates the stores from a prior save', async () => {
    const prior = collectSaveState();
    prior.settings.mode = 'classic';
    prior.purchases.ownedRegions = ['appalachia'];
    await AsyncStorage.setItem('@picross-cryptozoology/save/v1', JSON.stringify(prior));

    await initSaveSystem();
    expect(useSettingsStore.getState().mode).toBe('classic');
    expect(usePurchaseStore.getState().ownsRegion('appalachia')).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- saveManager` → FAIL.

- [ ] **Step 3: Implement**

Create `src/state/saveManager.ts`:
```typescript
import { loadSaveState, writeSaveState } from './persistence';
import { setChangeHandler } from './saveBus';
import { SaveStateV1 } from './saveTypes';
import { useSettingsStore } from './settingsStore';
import { useProgressStore } from './progressStore';
import { usePurchaseStore } from './purchaseStore';

/** Assemble the single save object from the three live stores. */
export function collectSaveState(): SaveStateV1 {
  const s = useSettingsStore.getState();
  const p = useProgressStore.getState();
  const pur = usePurchaseStore.getState();
  return {
    version: 1,
    savedAt: Date.now(),
    settings: {
      mode: s.mode,
      soundEnabled: s.soundEnabled,
      hapticsEnabled: s.hapticsEnabled,
      reduceMotion: s.reduceMotion,
      ambientAudioVolume: s.ambientAudioVolume,
      effectsAudioVolume: s.effectsAudioVolume,
    },
    progress: { solved: p.solved, onboardingCompleted: p.onboardingCompleted, firstLaunchAt: p.firstLaunchAt },
    purchases: {
      ownedRegions: pur.ownedRegions,
      ownedPacks: pur.ownedPacks,
      lastRestoredAt: pur.lastRestoredAt,
      purchaseHistory: pur.purchaseHistory,
    },
  };
}

/** Push a loaded save's slices into the stores. */
export function hydrateFromSave(save: SaveStateV1): void {
  useSettingsStore.getState().hydrate(save.settings);
  useProgressStore.getState().hydrate(save.progress);
  usePurchaseStore.getState().hydrate(save.purchases);
}

// Coalescing writer: every call chains onto a single queue and returns the
// tail, so `await persist()` resolves only after the latest write completes
// (no race). The `dirty` flag collapses a burst of calls into one write with
// the freshest state; the `.catch` keeps a failed write from poisoning the queue.
let queue: Promise<void> = Promise.resolve();
let dirty = false;

export function persist(): Promise<void> {
  dirty = true;
  queue = queue
    .then(async () => {
      if (!dirty) return;
      dirty = false;
      await writeSaveState(collectSaveState());
    })
    .catch(() => {
      // best-effort persistence; a failed write must not break the chain
    });
  return queue;
}

/** Boot: load, hydrate, and wire the persist handler. Returns the load result. */
export async function initSaveSystem(): Promise<{ state: SaveStateV1; recovered: boolean }> {
  const result = await loadSaveState();
  hydrateFromSave(result.state);
  setChangeHandler(() => {
    void persist();
  });
  return result;
}
```

Create `src/state/index.ts`:
```typescript
export * from './saveTypes';
export { SAVE_KEY, createDefaultSaveState, loadSaveState, writeSaveState } from './persistence';
export { setChangeHandler, notifyChange } from './saveBus';
export { useSettingsStore } from './settingsStore';
export { useProgressStore } from './progressStore';
export { usePurchaseStore } from './purchaseStore';
export { collectSaveState, hydrateFromSave, persist, initSaveSystem } from './saveManager';
```

- [ ] **Step 4: Run the FULL suite + typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: entire suite green (state + engine + atoms + scaffold), tsc exit 0.

- [ ] **Step 5: Check state coverage meets target**

Run:
```bash
npx jest --coverage --collectCoverageFrom='src/state/**/*.ts' src/state 2>&1 | tail -20
```
Expected: `src/state` ≥ 90% statements/functions/lines, ≥ 85% branches. If a branch is uncovered (e.g. `grantPack`, `getEntry` undefined path), add a focused test before committing.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(state): add saveManager + state barrel with round-trip persistence

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes for the executor

- Stores never touch AsyncStorage directly — only `persistence.ts`/`saveManager.ts` do. Keep it that way.
- Zustand stores are singletons across a test file; always reset them in `beforeEach` via `hydrate(...)` so tests don't bleed state.
- The AsyncStorage jest mock (`@react-native-async-storage/async-storage/jest/async-storage-mock`) is only needed in the persistence and saveManager tests. Store unit tests mock `@/state/saveBus` instead and never hit storage.
- `Date.now()` is used for timestamps — fine in app + jest. Tests assert relationships (best time preserved, playCount increments), not exact timestamps.
- The ephemeral gameplay store (`uiStore`: cellState/tool/history/tap/undo/checkWin over the engine) is a SEPARATE plan — do not build it here.
- Migration (`migrateV0toV1`, etc.) is a documented extension point in `loadSaveState`; there is no v0 data to migrate in this app, so do not fabricate a v0 schema.
