# Reveal: Next Puzzle / Back to Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After solving a puzzle, let the player choose **Next Sighting** (next puzzle in the region) or **Back to the List** (the region's puzzle list), instead of only "Add to Guide" → Home.

**Architecture:** `RevealScreen` swaps its single `onAddToGuide` button for two: an optional **Next Sighting** (shown only when a next puzzle exists) and **Back to the List**. The `/reveal/[id]` route derives the region from `puzzle.metadata.regionId`, finds the current puzzle's position, and wires `onNext` to the next puzzle (or omits it on the last one) and `onBackToSelection` to `/region/{regionId}`, both via `router.replace`.

**Tech Stack:** React Native + Expo Router, TypeScript, Jest + `@testing-library/react-native` v13. Reuses `Button`. No new deps; `expo-router` API unchanged.

## Global Constraints

- Never inline color/spacing/font values; import from `@/theme`. (project convention)
- Navigation uses `router.replace` (not `push`) so the back stack doesn't accumulate reveal→puzzle→reveal loops. (design decision)
- On the LAST puzzle of a region there is no next → `onNext` is omitted and the Next button is hidden; only "Back to the List" shows (which becomes the primary button). Progress is already saved on solve, so nothing is lost. (design decision)
- Region + next derivation uses `getSampleRegion(regionId)` and the region's `puzzles` array order (the puzzle id is `{regionId}-{order}`; "next" = the following entry in `region.puzzles`). (DATA_AND_ENGINE.md §1.5)
- `@testing-library/react-native` is v13 — synchronous `render`/`fireEvent`. (project convention)
- Every commit message ends with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Project root: `/home/chris/Code/cryptid-picross`.

---

### Task 1: RevealScreen — two navigation choices

**Files:**
- Modify: `src/components/screens/RevealScreen.tsx`
- Modify (rewrite): `src/components/screens/__tests__/RevealScreen.test.tsx`

**Interfaces:**
- Produces: `RevealScreen` props change — remove `onAddToGuide`, add `onNext?: () => void` and `onBackToSelection: () => void`.

- [ ] **Step 1: Rewrite the test**

Replace `src/components/screens/__tests__/RevealScreen.test.tsx` with:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RevealScreen } from '@/components/screens';
import { buildPuzzle } from '@/content/buildPuzzle';
import type { FieldEntry, PuzzleMetadata } from '@/engine';

const entry: FieldEntry = { title: 'THE CROSSING · CASE 001', body: 'A shape at the crossing.', voiceStyle: 'notebook' };
const metadata: PuzzleMetadata = { regionId: 'pnw', order: 1, isCapstone: false };
const easyPuzzle = buildPuzzle({ id: 'r1', name: 'The Crossing', subtitle: 'Field Test', grid: [[1, 0], [0, 1]], entry, metadata });

describe('RevealScreen', () => {
  it('renders the confirmed stamp, polaroid caption, and case file', () => {
    render(<RevealScreen puzzle={easyPuzzle} onBackToSelection={() => {}} testID="reveal" />);
    expect(screen.getByText('Sighting Confirmed')).toBeTruthy();
    expect(screen.getByText(/The Crossing/)).toBeTruthy();
    expect(screen.getByText('THE CROSSING · CASE 001')).toBeTruthy();
    expect(screen.getByText('A shape at the crossing.')).toBeTruthy();
  });

  it('shows a new-best callout when isNewBest and bestTime are given', () => {
    render(<RevealScreen puzzle={easyPuzzle} bestTime={75} isNewBest onBackToSelection={() => {}} testID="reveal" />);
    expect(screen.getByText(/New Best · 01:15/)).toBeTruthy();
  });

  it('always offers Back to the List and calls it', () => {
    const onBackToSelection = jest.fn();
    render(<RevealScreen puzzle={easyPuzzle} onBackToSelection={onBackToSelection} testID="reveal" />);
    fireEvent.press(screen.getByTestId('reveal-back'));
    expect(onBackToSelection).toHaveBeenCalledTimes(1);
  });

  it('shows Next Sighting only when onNext is given, and calls it', () => {
    const onNext = jest.fn();
    const { rerender } = render(<RevealScreen puzzle={easyPuzzle} onBackToSelection={() => {}} testID="reveal" />);
    expect(screen.queryByTestId('reveal-next')).toBeNull(); // last puzzle: no next
    rerender(<RevealScreen puzzle={easyPuzzle} onNext={onNext} onBackToSelection={() => {}} testID="reveal" />);
    fireEvent.press(screen.getByTestId('reveal-next'));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- RevealScreen` → FAIL (old props/button).

- [ ] **Step 3: Update the component**

In `src/components/screens/RevealScreen.tsx`:

1. Change the props interface:
```tsx
export interface RevealScreenProps {
  puzzle: Puzzle;
  bestTime?: number;
  isNewBest?: boolean;
  onNext?: () => void;
  onBackToSelection: () => void;
  testID?: string;
}
```
2. Change the destructure to `({ puzzle, bestTime, isNewBest = false, onNext, onBackToSelection, testID })`.
3. Replace the single `<Button label="Add to Guide" ... />` with the two buttons (Next only when `onNext` exists; Back is primary when there's no Next):
```tsx
      {onNext ? (
        <Button label="Next Sighting" variant="primary" fullWidth onPress={onNext} testID="reveal-next" />
      ) : null}
      <Button
        label="Back to the List"
        variant={onNext ? 'secondary' : 'primary'}
        fullWidth
        onPress={onBackToSelection}
        testID="reveal-back"
      />
```

- [ ] **Step 4: Run to verify it passes + typecheck**

Run: `npm test -- RevealScreen && npx tsc --noEmit` → PASS (4), exit 0.
(If a Button press throws on `expo-haptics` in jest, add `jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light' } }));` at the top of the test — but the prior RevealScreen test pressed a Button without it, so it likely isn't needed.)

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(screens): RevealScreen offers Next Sighting + Back to the List

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: wire the reveal route to next / back

**Files:**
- Modify: `src/app/reveal/[id].tsx`

**Interfaces:**
- Consumes: `getPuzzleById`, `getSampleRegion` from `@/content/sampleRegions`.

- [ ] **Step 1: Derive next + wire the handlers**

In `src/app/reveal/[id].tsx`:

1. Change the import `import { getPuzzleById } from '@/content/sampleRegions';` to `import { getPuzzleById, getSampleRegion } from '@/content/sampleRegions';`.
2. Replace the returned `RevealScreen` element (the one passing `onAddToGuide`) with next/back wiring computed from the region:
```tsx
  const regionId = puzzle.metadata.regionId;
  const region = getSampleRegion(regionId);
  const index = region ? region.puzzles.findIndex((p) => p.id === puzzle.id) : -1;
  const next = region && index >= 0 ? region.puzzles[index + 1] : undefined;

  return (
    <RevealScreen
      puzzle={puzzle}
      bestTime={entry?.time}
      onNext={next ? () => router.replace(`/puzzle/${next.id}`) : undefined}
      onBackToSelection={() => router.replace(`/region/${regionId}`)}
    />
  );
```
(Place these `const` lines after the `if (!puzzle) { ... }` guard so `puzzle` is defined; keep the guard's fallback UI unchanged.)

- [ ] **Step 2: Full suite + typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: entire suite green (RevealScreen updated; the reveal route has no unit test, like the other routes), tsc exit 0.

- [ ] **Step 3: Runnable check (headless bundle)**

Run:
```bash
rm -rf /tmp/cp-revnav-export && npx expo export --platform ios --output-dir /tmp/cp-revnav-export >/tmp/cp-revnav.log 2>&1; echo "export exit: $?"
```
Expected: `export exit: 0`. If it fails, read `/tmp/cp-revnav.log`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(app): reveal route wires Next Sighting + Back to the region list

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes for the executor

- "Next" = the following entry in `region.puzzles` (which is ordered by `order`); on the last puzzle there is no next, so `onNext` is `undefined` and RevealScreen hides the Next button.
- Both handlers use `router.replace` so the back stack stays sane (no reveal→puzzle→reveal accumulation).
- `PuzzlePlayScreen` already calls `progressStore.markSolved` before navigating to the reveal, so leaving the reveal never loses progress.
- After this, the controller will visually confirm: solve a PNW puzzle → the reveal shows both buttons → Next goes to the next sighting, Back goes to `/region/pnw`.
