# SCREEN_SPECS.md
### Picross: Cryptozoology — Detailed Screen Behavior Specifications

*Every screen in the app: purpose, layout, data dependencies, states, interactions, transitions, edge cases, and analytics. Claude Code should implement each screen exactly to spec. Ambiguity in this document is a bug — flag anything unclear before guessing.*

---

## Navigation Graph

The high-level flow between screens:

```
                     Onboarding (first launch only)
                          ↓
                        Home
                       /  |  \
                      /   |   \
             Regions  Settings  Field Guide
                |        |         (from Regions)
             Puzzle List |
                |        |
             Puzzle Play |
                |        |
              Reveal ────┘
                |
             (back to Puzzle List)


Modal overlays (present over any screen):
  - Paywall (when tapping locked region)
  - Confirm dialog (when clearing data, etc.)
```

**Routing:** Expo Router file-based. See `/src/app/` layout in `claude_code_handoff.md` Part 3.

**Modal presentation:** Paywall and confirm dialogs use Expo Router's `presentation: 'modal'` option so they slide up from the bottom, matching iOS native paradigm. On Android, they still slide from bottom for consistency.

**Back navigation:**
- iOS: swipe-back gesture works on all stack screens
- Android: hardware back button is handled by Expo Router by default
- Onboarding does NOT support back (progressive-only)
- Paywall dismisses to previous screen on back

---

## Screen 1 — Onboarding

**Route:** `/onboarding`
**Shown when:** `progressStore.onboardingCompleted === false`
**Route guard:** any launch check redirects here if flag is unset

### Purpose

Teach the nonogram mechanic in 4 progressive screens using a small (5×5) practice puzzle. First-time-only. Users can skip after step 2.

### Layout

Four-step carousel with a persistent bottom bar containing "Next" or "Solve" button. Step indicator dots at top.

### Steps

**Step 1 — "Every clue counts."** Static screen. Shows a 5×5 grid with numbers on the sides. Tagline: "These numbers tell you how many cells to fill in each row and column." Big "Next" button.

**Step 2 — "Try it."** Interactive. Shows same 5×5 grid, this time with a specific simple pattern (a heart or arrow, ~7 filled cells). Tagline: "Tap cells to fill them. See if you can figure out where they go." User must tap at least 3 correct cells before Next enables. Skip button appears in top-right after 30 seconds of inactivity.

**Step 3 — "Mark what's empty."** Interactive. Shows the same puzzle mid-solve. Tagline: "Long-press to mark a cell as definitely empty. Marks are for your own reference — they don't count as answers." User must place at least 1 mark before Next enables.

**Step 4 — "The trail begins."** Static. Shows the completed puzzle with a bat reveal. Tagline: "That's the whole game. Solve puzzles, unlock cryptid case files, fill your field guide. Watch the treeline." Big "Start investigating" button that navigates to Home.

### States

- Step 1-4 (linear)
- Skip requested (jumps to step 4, still shows completion)

### Interactions

- Tap "Next" — advance step
- Tap "Skip" (steps 2-4) — jump to step 4
- Complete step 2 practice — auto-advance after 1s
- Tap "Start investigating" — sets `progressStore.onboardingCompleted = true`, navigates to Home

### Transitions

- Between steps: horizontal slide (400ms, easeOut)
- Exit to Home: fade + subtle scale-up on the field book on Home screen

### Edge cases

- User backgrounds mid-onboarding: on resume, restart current step
- User has completed onboarding but manually resets in Settings: onboarding shows again on next app open
- Accessibility: reduce-motion setting disables slide transitions, uses instant swap

### Analytics events

- `onboarding_started` (on entry)
- `onboarding_step_completed` (step number as prop)
- `onboarding_skipped` (from step number)
- `onboarding_completed` (with total duration in seconds)

---

## Screen 2 — Home

**Route:** `/` (index)
**Shown when:** always after onboarding

### Purpose

Landing screen. Presents the field guide as a physical book on a desk. Provides entry to the game.

### Layout

Full-screen paper background. Centered wooden desk overhead view (subtle, low-contrast). Field guide book prominently in center (260×340pt on iPhone 6.7"). Settings gear icon top-right. Small "tap prompt" text below book that pulses gently.

### Data dependencies

- `progressStore.solved` — determines if user has any progress (affects prompt text)
- `settingsStore` — for reduce-motion setting

### States

- **First launch (after onboarding)** — prompt text: "tap the guide to begin"
- **Returning with progress** — prompt text: "tap to continue your investigation"
- **All content complete** — prompt text: "welcome back, investigator"

### Interactions

- Tap the field book → navigate to Regions
- Tap the settings gear → navigate to Settings

### Transitions

- Book tap: book scales down (0.97) then fades out with subtle "opening" animation while Regions screen slides up from below. Total duration ~500ms.
- On return from Regions: reverse animation.

### Edge cases

- User has no purchases at all: normal Home experience (Region 1 is free)
- User has completed all content: replace tap-prompt with subtle Easter-egg animation (maybe a tiny cryptid silhouette occasionally peeks from the book's edge)

### Analytics events

- `home_viewed` (with session count)
- `home_book_tapped`

---

## Screen 3 — Regions

**Route:** `/regions`
**Shown when:** navigated from Home

### Purpose

Show the world map with all regions. Player picks where to investigate. Locked regions are visible but require purchase.

### Layout

Top: back button (left), title "EXPEDITIONS" (center), no right icon.
Below title: subtitle italic text — "Choose a region to investigate."
Main content: `WorldMap` organism taking most of the screen.
OR: fallback list of `RegionCard`s if map fails to load or accessibility mode preferred.

**Toggle map/list view:** small icon in top-right lets user switch views. Preference persists.

### Data dependencies

- All region content JSONs
- `progressStore.solved` — for progress-per-region
- `purchaseStore.ownedRegions` — for lock state

### States

- **Fresh install** — Region 1 unlocked (free), others locked-purchasable
- **Some purchased** — mixed unlocked/locked pins
- **All purchased** — no locked state, only progress shown
- **Halloween pack owned but seasonal pack not yet released** — shows a "New" badge

### Interactions

- Tap unlocked pin → navigate to Puzzle List for that region
- Tap locked pin → open Paywall modal for that region
- Tap "coming soon" pin → toast: "Available with the next update"
- Toggle map/list view → smooth crossfade

### Transitions

- Pin tap: pin scales up 1.2 then holds while transition animation begins
- Region unlock (after purchase): dramatic "pin lights up" animation, ambient bed shifts to region-specific audio
- Enter/exit: standard stack transition (300ms slide)

### Edge cases

- Zero regions purchased AND all locked: impossible state (Region 1 is always free)
- Region content JSON fails to load: show error state for that region only, other regions still work
- Network issue during purchase: paywall handles error, this screen just re-checks purchase state on focus

### Analytics events

- `regions_viewed`
- `region_pin_tapped` (with region id, locked status)
- `region_view_toggled` (map ↔ list)

---

## Screen 4 — Puzzle List

**Route:** `/region/[id]`
**Shown when:** user picks a region

### Purpose

Scrollable list of all puzzles in the region. Shows completion state and best times.

### Layout

Top bar: back button (returns to Regions), region name label centered.
Below: title (region name), italic subtitle (region tagline).
Main: scrollable list of `PuzzleCard`s, one per puzzle. Header row every 25 items showing tier grouping ("EASY", "MEDIUM", "HARD", "EXPERT").

### Data dependencies

- Region JSON for the ID
- `progressStore.solved` filtered to this region's puzzles

### States

- **None solved** — all cards show "???" for name, no check marks
- **Some solved** — mix of "???" and revealed names
- **All solved** — all revealed, subtle completion celebration at top ("Region complete · every sighting confirmed")
- **Cross-purchase state** — if this is a locked region shown accidentally (shouldn't happen but defensive coding): show "Locked" overlay with paywall CTA

### Interactions

- Tap card → navigate to Puzzle Play
- Long-press card → show "already solved" info popover (best time, mistakes, tap to replay)
- Scroll to bottom → subtle "capstone" callout appears for the 25×25 flagship puzzle

### Transitions

- Card tap: card scales down (0.98) then screen transitions to Puzzle Play with a "book turning" flip animation (600ms)
- On return: same animation reversed

### Edge cases

- Puzzle IDs missing from `progressStore` due to save corruption: treat as unsolved (safe default)
- User revisits a solved puzzle: still playable, but best time is only overwritten if beaten

### Analytics events

- `puzzle_list_viewed` (with region id)
- `puzzle_selected` (with puzzle id, tier, isReplay)

---

## Screen 5 — Puzzle Play

**Route:** `/puzzle/[id]`
**Shown when:** user picks a puzzle

### Purpose

The core game loop. Player solves the nonogram.

### Layout

**Top bar:** back button (exits without saving progress → confirm dialog if any cells filled), tier badge (center-right).
**Header:** puzzle title (or "SIGHTING #001" if unsolved), italic subtitle.
**Timer bar:** MM:SS · X mistakes (right side).
**Classic mode only:** "CHECK MY WORK" button.
**Main:** `PuzzleGrid` organism (dynamically sized to fit).
**Bottom:** `PuzzleToolbar` organism.

### Data dependencies

- Puzzle JSON via URL param
- `settingsStore.mode` (affects wrong-cell display)
- `uiStore.*` (all runtime puzzle state)

### States

- **Fresh (no cells filled)** — timer at 00:00, mistakes 0
- **In progress** — mixture of fills and marks
- **Complete** — transitions immediately to Reveal (no dwell)
- **Paused** — user backgrounded app; timer freezes, resumes on return
- **Long-press hint offer** — after 5 min of no progress, subtle prompt: "Tap the hint button if you need a nudge"

### Interactions

- Tap cell (Fill mode): fill or clear
- Tap cell (Mark mode): mark or unmark
- Tap Fill/Mark toolbar buttons: switch tool
- Tap Undo: revert last cell action
- Tap Hint: reveal one correct cell (limited to 3 per puzzle)
- Tap Check My Work (Classic only): highlight wrong cells for 2s
- Tap back: if any cells filled, confirm dialog "Exit? Progress will be lost." Otherwise instant exit.
- Long-press cell: alternate tool for that cell only (Fill→Mark, Mark→Fill)

### Transitions

- Enter: from Puzzle List, "book flip" animation showing the puzzle page turning
- Exit (win): trigger Reveal modal after 500ms delay for satisfaction
- Exit (back button): confirm dialog if needed, then reverse book flip

### Edge cases

- Very large grid (25×25) on small phone: grid wraps in `ScrollView`, clues remain sticky
- User exhausts all 3 hints: hint button greys out, tooltip explains "watch a rewarded ad to earn another" (post-launch feature; v1 just shows "no hints left")
- Cellular network error (irrelevant — game is offline)
- User completes puzzle in <10 seconds: might be a re-solve — show reveal but skip "new best" celebration if same as prev best
- Save state write fails after win: retry once, then log and show subtle warning "Progress saved locally" (which is what always happens anyway)

### Analytics events

- `puzzle_started` (with id, tier, isReplay)
- `puzzle_completed` (with id, tier, time, mistakes, hintsUsed, isNewBest)
- `puzzle_abandoned` (with id, elapsedTime, cellsFilled)
- `hint_used` (with id, hintsRemaining)
- `mode_check_work_used` (Classic mode only)

---

## Screen 6 — Reveal

**Route:** `/reveal` (modal)
**Shown when:** puzzle completed

### Purpose

Celebrate the completion. Show the developed polaroid. Present the field guide entry.

### Layout

Full-screen modal over the Puzzle Play screen (which remains behind, blurred). Center: `Stamp` "SIGHTING CONFIRMED" or "CLASSIFIED FILE" (for Expert). Below: `Polaroid` with the completed grid. Below: `FieldEntryCard` with the case file text. Bottom: "ADD TO GUIDE" button.

### Data dependencies

- Just-completed puzzle data
- `progressStore` (to check if new best time)

### States

- **First solve** — full celebration, "SIGHTING CONFIRMED" stamp animates in, polaroid drops
- **Replay with new best** — additional "NEW BEST · MM:SS" callout above polaroid caption
- **Replay without new best** — no "new best" callout, previous best time shown small under polaroid

### Interactions

- Tap "ADD TO GUIDE" → dismiss modal, return to Puzzle List
- Tap outside polaroid — no effect (modal doesn't dismiss on tap-outside)
- Tap and hold polaroid — subtle rotation follows finger for tactile feedback

### Transitions

- Enter: black background fades in (300ms), then stamp animates in (500ms), then polaroid drops (800ms), then field entry fades in (400ms with 400ms delay), then button appears (400ms with 800ms delay). Total ~1.6s of choreography.
- Sound choreography: subtle chime as stamp appears, camera-flash+shutter as polaroid drops, quiet page-turn as entry appears.
- Exit: full modal fades out (300ms), Puzzle List reappears.

### Edge cases

- User backgrounds during reveal: freeze animation; on resume, jump to final resting state
- User backgrounds before tapping "ADD TO GUIDE": next launch returns to Puzzle List (Reveal is not persisted)
- If reduce-motion is on: no drop animation, polaroid appears in place with cross-fade

### Analytics events

- `reveal_shown` (with puzzle id, isNewBest, tier)
- `reveal_dismissed` (with duration user spent on screen)

---

## Screen 7 — Field Guide

**Route:** `/field-guide`
**Shown when:** navigated from Regions or Home (v1.1+ feature — v1 might defer this)

### Purpose

Browsable index of all solved cryptids. Player can re-read case files, see their collection.

### Layout

Top: back button, title "FIELD GUIDE".
Below: filter tabs (All Regions / PNW / Appalachia / British Isles / Outback).
Main: scrollable grid of thumbnails (2 columns on phones, 3 on tablets). Each thumbnail = a small pixel-art preview + cryptid name.

Locked entries show as `?` silhouettes.

### Data dependencies

- All region JSONs
- `progressStore.solved` — filters to unlocked only

### States

- **Early game (0-10 solved)** — mostly `?` cards, gentle prompt: "solve puzzles to fill your guide"
- **Mid game (10-100 solved)** — mix
- **Late game (>100 solved)** — dense collection

### Interactions

- Tap thumbnail (unlocked) → open `FieldEntryCard` in full-screen modal
- Tap thumbnail (locked) → gentle bounce animation, no navigation
- Tap filter tab → filter view

### Transitions

- Enter: standard stack transition
- Filter tap: smooth crossfade of visible thumbnails

### Edge cases

- Zero solved puzzles: show only the "start solving" prompt, no thumbnails
- All solved: subtle "collection complete" banner at top

### Analytics events

- `field_guide_viewed`
- `field_entry_reread` (with cryptid name)

---

## Screen 8 — Settings

**Route:** `/settings`
**Shown when:** gear icon tapped from Home

### Purpose

User preferences, data management, purchases, credits.

### Layout

`SettingsPanel` organism. See COMPONENT_LIBRARY 3.4 for section breakdown.

### Data dependencies

- `settingsStore` (all fields)
- `progressStore` (for stats)
- `purchaseStore` (for restore purchases)

### States

- **Default** — all sections visible
- **After Clear All confirmation** — sections re-render with cleared state
- **During restore purchases** — loading spinner on the button

### Interactions

- Toggle mode → updates settingsStore, toast "Cozy mode enabled" / "Classic mode enabled"
- Toggle sound/haptics → updates immediately
- Tap Restore Purchases → RevenueCat.restore(), spinner, toast on complete
- Tap Clear All Data → confirm dialog → clear all stores → toast "Data cleared"
- Tap credits/links → open in-app browser (expo-web-browser)

### Transitions

- Enter/exit: standard stack transition
- Toggle switches: 200ms spring

### Edge cases

- Restore purchases fails (no internet): toast "Couldn't reach the store. Try again later."
- User taps Clear All while data is being written: queue clear until write completes

### Analytics events

- `settings_viewed`
- `setting_changed` (with settingName, newValue)
- `data_cleared`
- `purchases_restored` (with count restored)

---

## Screen 9 — Paywall

**Route:** `/paywall` (modal)
**Shown when:** user taps a locked region, OR from Settings "Get Full Bundle"

### Purpose

Present purchase options. Convert.

### Layout

Full-screen modal. Top: close X. Center-top: hero visual — pixel-art of the region's flagship cryptid, dramatically lit. Below: region name and description. Below: two purchase cards side by side:
- "This Region — $2.99"
- "Full Bundle (All 4 Regions) — $6.99" *(with "Best Value" badge)*

Below: "Restore Purchases" text link (small, secondary).

### Data dependencies

- Region info (which region user is trying to unlock)
- RevenueCat product info (fetched on mount)

### States

- **Products loading** — placeholder shimmer
- **Products loaded** — prices populated
- **Products failed to load** — error state with retry
- **Purchase in progress** — spinner on tapped card
- **Purchase succeeded** — full-screen success animation ("Unlocked!" with fireworks-of-fog effect), auto-dismisses
- **Purchase failed** — toast with error message
- **Purchase cancelled** — return to paywall as before

### Interactions

- Tap "This Region" → RevenueCat.purchase(regionProductId)
- Tap "Full Bundle" → RevenueCat.purchase(bundleProductId)
- Tap "Restore Purchases" → RevenueCat.restore()
- Tap X → close modal

### Transitions

- Enter: slide up from bottom (400ms)
- Purchase success: hero visual pulses, "UNLOCKED" stamp animates in, region "lights up" on background world map (visible through the closing modal), then modal dismisses (1.5s total)
- Exit (close): slide down

### Edge cases

- User already owns this region (buggy state): show error toast, dismiss modal
- User already owns the bundle: hide "Full Bundle" card, only show "This Region" — but with warning that they might already own it
- Store products misconfigured on RevenueCat side: show human error message, don't crash
- Restore purchases works — unlock the region without a purchase transaction

### Analytics events

- `paywall_viewed` (with regionId, entryPoint)
- `paywall_purchase_started` (with productId)
- `paywall_purchase_succeeded` (with productId, priceUSD)
- `paywall_purchase_cancelled` (with productId)
- `paywall_dismissed_without_purchase`

---

## Screen 10 — Completion

**Route:** `/completion`
**Shown when:** user solves the last puzzle they own (checks after every reveal)

### Purpose

Reward the completionist. Say thank you.

### Layout

Full-screen paper background. Center: large hand-drawn "field notes" style card. Contents:
- "That's every sighting."
- "Thank you for investigating with us."
- Small stats (total solved, total time, discovery date range)
- Signature: "— The Cryptid Field Guide team (of one)"
- Small note: "New region releasing [month]. Watch this space."
- Big button: "Return to your guide"

### Data dependencies

- `progressStore` (for stats)

### States

- **First shown** — full celebration
- **Return visit** (via a debug menu maybe) — same content, no confetti

### Interactions

- Tap "Return" → back to Home
- Tap on the card → the card gently rotates (Easter egg tactile feedback)

### Transitions

- Enter: card falls in from above with realistic paper physics (spring damped, ~1s)
- Confetti: subtle brown "leaves" fall in the background for 3 seconds
- Sound: distant church bell single ring, then quiet ambient

### Edge cases

- User buys more content later: this screen re-appears after they complete THAT
- User replays already-solved puzzles: doesn't retrigger completion

### Analytics events

- `completion_shown` (with totalSolved, totalTimeSeconds)

---

## Global Behaviors

### Backgrounding

App backgrounds → pause any active timer, freeze any active animation, cache uiStore state in memory (not persisted). On resume, restore where possible or restart the current screen cleanly.

### Deep Linking

Configure Expo Router universal links for:
- `picrosscryptozoology.app/region/{id}` → opens Regions screen and highlights the region
- `picrosscryptozoology.app/puzzle/{id}` → opens the specific puzzle if owned, else Paywall

Deep links from Reddit / Twitter posts should Just Work.

### Orientation

Portrait-only. Lock via `expo-screen-orientation`. Never rotate. This game has no landscape UX.

### Splash Screen

Custom splash matching icon: dark background, animated cryptid silhouette that pulses (eyes glow briefly). Fades to Home when ready. Max 2s duration.

### First-launch flow

```
App opens
  ↓
Load save state (or create default)
  ↓
If onboardingCompleted === false → navigate to Onboarding
  ↓
Else → navigate to Home
```

### Error boundaries

Every screen wrapped in an error boundary. If any screen crashes at runtime, show a fallback ("Something went wrong. Head back to the guide.") with a back button that always works.

### Toast system

Global toast for confirmations. Position: top-center. Duration: 1.2s. One at a time (queued if multiple triggered). Design uses `PaperSurface` with `elevated`.

---

*End of SCREEN_SPECS.md. Every screen the app needs is spec'd here. Any behavior not documented is a decision to be made — flag it to the user before implementing.*
