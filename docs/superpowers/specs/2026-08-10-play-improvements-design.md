# Play Improvements — Design

*Date: 2026-08-10. Four related improvements to make the game teachable, verifiably correct, mobile-playable, and properly navigable. Each workstream is built as its own reviewed, tested round (own plan → subagent-driven execution → GitHub sync).*

Grounding: verified live in the running web app that puzzle taps are correct (correct cell → fills with 0 mistakes; wrong cell → red `#9B3B2E` + mistakes increments). The earlier browser-automation "timeouts" were the tool tripping over the live 1-second timer, not a game bug.

---

## Build order

1. **D — Verification + fixes** (quick)
2. **C — Mobile UI sizing** (biggest playability win)
3. **B — How-to-play intro**
4. **A — Main menu (Home redesign)**

---

## D. Verification + fixes

**Goal:** formalize puzzle correctness and fix a copy bug.

- **Solve-to-win test:** an end-to-end test that, for each sample puzzle (`sample-plus`, `sample-eye`, `appalachia-001`), fills exactly the solution cells via the real component tap path and asserts the puzzle reaches `won` (and `onWin` fires with the right mistakes). This is beyond the existing `PuzzleGrid` unit tests — it exercises a full real puzzle end to end. Likely a test in `PuzzleGrid` or `PuzzlePlayScreen` that drives `useUiStore` through the actual cells.
- **Grammar fix:** the mistake counter shows `"1 mistakes"`; make it singular for a count of 1 (`"1 mistake"`, `"0 mistakes"`, `"2 mistakes"`). Lives in `PuzzlePlayScreen.tsx`. A small pluralize helper (or inline) — add a unit test.

Non-goal: changing the timer's per-second re-render (works fine; a later perf refinement if ever needed).

---

## C. Mobile UI sizing

**Goal:** the puzzle fills the screen and everything is thumb-friendly on a phone.

- **Grid fit-to-screen:** `PuzzleGrid` currently sizes cells from available *width* only (capped at `layout.gridCellMax = 40`) and centers in a lot of empty vertical space. Change to size from **both** width and height: `cellSize = clamp(min(availW/cols, availH/rows), gridCellMin, gridCellMax)`, where `availH` is the space between header and toolbar. Raise `gridCellMax` (e.g. 40 → ~56) so small grids (5×5) fill the space; large grids (25×25) still fit (bottom out at `gridCellMin`, then scroll — existing behavior). The grid needs the available height, so `PuzzleGrid`/`PuzzlePlayScreen` measures its container (e.g. `onLayout`) or the screen passes an available size.
- **Bigger clue numbers:** the row/column clue font scales up with cell size (currently fixed `size.xs`); tie it to `cellSize` (e.g. ~`cellSize * 0.34`, clamped) so clues stay readable as cells grow.
- **Touch targets:** cells render at their computed size; where a cell is < 44pt (large grids), the grid provides `hitSlop` so taps stay reliable. Confirm the toolbar icon buttons are ≥ 44pt (they are).
- **Legibility sweep (other screens):** modest bumps so screens read well on a phone — taller `RegionCard`/`PuzzleCard` rows, slightly larger body/button text where cramped. Keep it a light, token-driven pass (adjust `spacing`/type usages, not a redesign). Scope this conservatively; the puzzle grid is the priority.

Tests: `PuzzleGrid` still renders all cells + clues; sizing math has a unit test (small grid → larger cell; constrained height → smaller cell; clamped bounds).

---

## B. How-to-play intro

**Goal:** a clear, skippable rules explainer as the first onboarding step (the user does not play picross, so the rules must be correct and legible).

- **New first step(s):** a **2–3 page illustrated rules explainer** prepended to the existing onboarding carousel:
  1. *What it is* — "Fill the right cells to reveal a hidden creature. The numbers are your clues."
  2. *Reading the clues* — a small **annotated example grid** showing a row with clue **`3 1`** solved: a run of 3 filled cells, a gap, then a run of 1, with the clue and cells visually tied together. Explain: numbers = lengths of consecutive filled runs, in order, with at least one empty cell between runs.
  3. *Marks* — "Tap in mark mode to note a cell you know is empty (✕). Marks are just for you."
- **Skip:** a **Skip** control visible throughout onboarding that jumps straight to Home (sets `onboardingCompleted`). "Optionally skip if you know how to play."
- **Flow:** explainer pages → the existing hands-on steps (fill 3, mark 1, start). The step-dot indicator covers all steps.
- Implementation: extend `OnboardingScreen` (add explainer steps before the practice steps; add a Skip affordance). The rules-example grid can be a small static rendering (reuse `PuzzleCell` for the annotated cells, non-interactive). Keep local state, no `uiStore`.

Tests: onboarding renders the new first step + Skip; Skip calls the completion path; existing gated practice steps still work.

---

## A. Main menu (Home redesign)

**Goal:** replace the sparse Home placeholder with a real, on-theme main menu.

- **Menu entries** (field-guide book motif, the specs' Home intent):
  - **BEGIN INVESTIGATION** → `/regions`
  - **CONTINUE** → the most-recently-played puzzle (derive from `progressStore` `solved[*].lastPlayedAt`, pick max); **hidden when there's no play history**
  - **SETTINGS** → `/settings` (the ⚙ gear stays as well)
- Keep the onboarding redirect gate. Keep the title treatment; make the menu buttons the primary affordance (not a small text link).
- Regions → Puzzle List stays the puzzle selector (polished for touch in C), so no new flat grid.
- Implementation: rework `src/app/index.tsx` (Home) into a `MainMenuScreen` component (testable) that reads `progressStore` for the Continue target, with the route thin. Reuse the `Button` atom for menu entries.

Tests: menu renders Begin + Settings; Continue shows only with history and targets the right puzzle id; onboarding redirect still holds.

Deferred (not in this menu): the Field Guide browser screen (SCREEN_SPECS Screen 7), Completion screen, credits/links.

---

## Notes

- Each workstream ships as its own plan + subagent-driven round + GitHub sync, in the order above.
- The pieces are mostly independent; C touches `PuzzleGrid`/`PuzzlePlayScreen`, B touches `OnboardingScreen`, A touches Home, D touches `PuzzlePlayScreen` + a new test.
- Web target: `react-native-web`/`react-dom`/`@expo/metro-runtime` were added for play-testing; commit that as a small chore so the tree is clean.
