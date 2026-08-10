# QA_AND_LAUNCH.md
### Picross: Cryptozoology — Testing, Accessibility, Sound, Animation, and Launch Operations

*The operational document. Everything that determines quality of the shipped app and how it gets from a local dev build to live on both stores.*

---

## Part 1 — Testing Strategy

### 1.1 Testing Pyramid

Prioritize in this order — more effort at the base, less at the top:

**Unit tests (~70% of test effort)** — pure functions. Puzzle engine, difficulty scoring, state store logic, utility functions. Fast, deterministic, high coverage.

**Component tests (~25% of test effort)** — individual components rendering their documented states. Snapshot + interaction testing. React Native Testing Library.

**End-to-end tests (~5% of test effort)** — critical user flows: complete onboarding, solve first puzzle, purchase a region. Detox on iOS + Android emulator.

Anti-pattern: skipping unit tests and only writing E2E tests. E2E tests are slow, flaky, and expensive to maintain. Push logic down to unit-testable functions.

### 1.2 Unit Test Coverage Targets

Enforce via `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  },
  './src/engine/': {
    statements: 95,     // engine is the most critical code — near-total coverage
    branches: 90,
    functions: 95,
    lines: 95,
  },
  './src/state/': {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90,
  },
}
```

CI fails if coverage drops. Never ship below threshold.

### 1.3 What to Test in the Engine

Every function in `/src/engine/`:

- `lineClues([1,1,0,1,1,1])` → `[2, 3]`
- `lineClues([0,0,0,0])` → `[0]`
- `deriveClues(grid)` — for every puzzle in `sample_pack.json`, output matches Python engine byte-for-byte
- `analyzePuzzle` — validates uniqueness for known-unique test puzzles, correctly rejects known-ambiguous ones
- `scoreDifficulty` — output matches Python engine for every puzzle in `sample_pack.json`
- `isSolved(playGrid, targetGrid)` — true when exact match, false when missing fill, false when extra fill, marks don't affect result

### 1.4 What to Test in State Stores

- `progressStore.markSolved` writes correct time/mistakes/timestamp
- `progressStore.markSolved` preserves best time (doesn't overwrite worse time)
- `progressStore.isSolved` returns true/false correctly
- `settingsStore.setMode` updates and persists
- `purchaseStore` correctly tracks owned regions after mock RevenueCat calls
- `uiStore.tap` mutates cell state per rules
- `uiStore.undo` reverses last action
- All stores survive AsyncStorage round-trip (persist middleware)

### 1.5 What to Test in Components

Every component from COMPONENT_LIBRARY.md:

- Renders every documented state without crashing
- Snapshot matches design mockup structure (approximate — snapshots can update deliberately)
- `onPress` etc. fire correctly with expected arguments
- Accessibility roles/labels present on every interactive element
- Reduce-motion respected (verify no animation classes applied when flag is on)

Use React Native Testing Library, not Enzyme (Enzyme doesn't support RN).

### 1.6 What to Test in E2E (Detox)

Only the flows a broken version would obviously ruin:

- **Fresh install flow:** onboarding → home → regions → puzzle list → solve first puzzle → reveal → back to list
- **Purchase flow (sandbox):** locked region → paywall → mock purchase → region unlocked → play a puzzle from that region
- **Persistence flow:** solve puzzle → force-quit app → relaunch → verify puzzle shows solved with correct time

Everything else use component/unit tests. E2E tests over 3 total = you're wasting time on maintenance.

### 1.7 Content Validation Tests

Run `/scripts/validate-content.ts` in CI. Verifies:

- All region JSONs conform to schema
- All 400+ puzzles have valid grids
- All puzzles have field entries
- Difficulty scores match declared tiers (or explicit override applied)
- No duplicate puzzle IDs across regions
- All Indigenous-source cryptids have cultural credit text
- All pixel art files match their declared grid dimensions

Fails build if any check fails.

### 1.8 Manual Testing Checklist

Before every release, run this manually on both an iOS device and an Android device:

- [ ] Fresh install → onboarding completes cleanly
- [ ] Every region's first puzzle plays end-to-end
- [ ] Purchase flow works in sandbox (both stores)
- [ ] Restore purchases works after wiping and reinstalling
- [ ] Backgrounding mid-puzzle → resume works cleanly
- [ ] Reduce motion setting kills all animations
- [ ] VoiceOver reads every screen coherently (iOS)
- [ ] TalkBack reads every screen coherently (Android)
- [ ] Dynamic type at largest size doesn't break layouts
- [ ] Dark/light mode both work (or dark mode is deliberately unsupported and documented)
- [ ] Portrait rotation stays locked
- [ ] All sounds play at declared volume
- [ ] Haptics fire on interactive elements
- [ ] Font loading doesn't cause FOUT

---

## Part 2 — Accessibility Standards

### 2.1 WCAG 2.1 AA Compliance

Non-negotiable minimum. All requirements below map to WCAG success criteria.

### 2.2 Color Contrast

- All text against background: **≥ 4.5:1** contrast ratio (WCAG AA)
- Large text (≥ 18pt or ≥ 14pt bold): ≥ 3:1
- Interactive UI elements against surrounding: ≥ 3:1

Verify with WebAIM Contrast Checker or Xcode's Accessibility Inspector. The palette has been pre-checked:

| Foreground / Background | Ratio | Pass |
|---|---|---|
| Ink Primary #2B241B on Paper Cream #F1E8D3 | 11.2:1 | AAA |
| Ink Soft #4A3D2C on Paper Cream #F1E8D3 | 7.4:1 | AAA |
| Ink Faded #7A6849 on Paper Cream #F1E8D3 | 3.9:1 | AA (large text only) |
| Paper Cream on Ink Primary | 11.2:1 | AAA |

**Rule:** Ink Faded is only used for tertiary text at ≥ 14pt bold or ≥ 18pt regular. Never below.

### 2.3 Touch Targets

- Minimum: 44pt × 44pt (Apple HIG) / 48dp × 48dp (Material)
- We hit both by using 44pt uniformly
- If a visual element is smaller (e.g., a grid cell at 20pt), its touch target still expands to 44pt via `hitSlop`

### 2.4 Screen Reader Support

Every interactive element:
- `accessibilityRole` set correctly ('button', 'link', 'checkbox', 'header', 'image', etc.)
- `accessibilityLabel` describes the element in a natural sentence
- `accessibilityHint` describes what happens on activation (only if non-obvious)

**Screen-specific requirements:**

**PuzzleGrid:** each cell announces its current state ("row 3, column 5, empty" / "row 3, column 5, filled"). Column and row clues have their own accessible focus zone before the grid so screen reader users can hear the constraints. Alternative: an "accessibility toggle" that reads the entire puzzle state as a narrated sequence.

**Reveal screen:** the polaroid caption + entry title + entry body are read as one continuous unit when focused. The stamp is decorative — hide from screen reader with `accessibilityElementsHidden={true}`.

**World map:** each pin has its region's name as label, "unlocked" or "locked" as part of the label, and "double tap to open" as hint.

### 2.5 Dynamic Type

- All body and header text uses React Native's `allowFontScaling={true}` (the default)
- All layout uses `flexbox`, not fixed widths, so it can grow
- Test at largest system font size — no text clipping, no overflow into other UI, no unreadable stacking

**Exception:** puzzle grid clue numbers must remain at fixed size relative to cell size. Set `allowFontScaling={false}` on those.

### 2.6 Reduce Motion

Respect both:
- The system-level setting (`AccessibilityInfo.isReduceMotionEnabled()`)
- The app-level manual override (`settings.reduceMotion`)

Combine as OR — either being true triggers reduced motion mode.

**Effects in reduced motion mode:**
- No entrance/exit animations for screens (instant swap)
- No polaroid drop (fades in)
- No stamp scale-in (fades in)
- No cell-fill scale animation (instant)
- No shake on wrong cell (still shows red, no motion)
- No page-turn transition (crossfade)

### 2.7 Non-Color Cues

Never use color as the only cue. Every color signal has a redundant signal:

- Wrong cell = red AND shakes AND has a specific sound
- Correct fill = ink AND has a specific pencil sound
- Difficulty tier = color AND tier name text
- Locked region = greyed AND lock icon
- New best time = candle-glow color AND "new best" text

### 2.8 Keyboard / Switch Control Support

For iOS Switch Control and hardware keyboards:
- All interactive elements are focusable
- Focus order matches visual order (top-to-bottom, left-to-right)
- No focus traps (user can always escape a modal)

---

## Part 3 — Sound Design Specification

### 3.1 Sound Catalog

All sounds live in `/src/assets/sounds/`. Format: `.m4a` (small, iOS-native). Fallback to `.ogg` for Android via bundle.

| File | Purpose | Duration | Volume |
|---|---|---|---|
| `ambient_pnw.m4a` | Region background loop (Pacific Northwest) | 30s loop | 0.15 |
| `ambient_appalachia.m4a` | Region background (Appalachia) | 30s loop | 0.15 |
| `ambient_british.m4a` | Region background (British Isles) | 30s loop | 0.15 |
| `ambient_outback.m4a` | Region background (Australian Outback) | 30s loop | 0.15 |
| `sfx_pencil_fill.m4a` | Cell filled correctly | 0.2s | 0.5 |
| `sfx_pencil_wrong.m4a` | Cell filled incorrectly (Cozy mode) | 0.2s | 0.5 |
| `sfx_mark.m4a` | Cell marked with X | 0.15s | 0.4 |
| `sfx_undo.m4a` | Undo action | 0.15s | 0.4 |
| `sfx_hint.m4a` | Hint revealed | 0.5s | 0.5 |
| `sfx_row_complete.m4a` | Row or column completed | 0.4s | 0.5 |
| `sfx_camera_shutter.m4a` | Polaroid drops on reveal | 0.6s | 0.7 |
| `sfx_page_turn.m4a` | Field entry appears on reveal | 0.8s | 0.5 |
| `sfx_bell.m4a` | Completion screen | 2.0s | 0.6 |
| `sfx_button_tap.m4a` | Generic button press | 0.1s | 0.4 |

### 3.2 Playback Rules

- Ambient bed plays only during Puzzle Play screen and stops when leaving
- Ambient bed cross-fades on region change (2s crossfade)
- SFX plays at exact volumes above, respecting `settings.effectsAudioVolume` multiplier
- Ambient plays at exact volumes above, respecting `settings.ambientAudioVolume` multiplier
- If `settings.soundEnabled === false`, nothing plays
- Multiple SFX can overlap (independent instances)
- Ambient is exclusive (only one region's ambient at a time)
- When app backgrounds, all sounds pause
- When app resumes to Puzzle Play, ambient resumes

### 3.3 Sound Sourcing

**Do NOT record your own or generate synth sounds.** Time is worth more than money here.

License from:
- **Soundly** (~$99/yr) — huge library, easy licensing
- **Freesound.org** — free with CC licenses, requires attribution
- **Zapsplat** (~$29/yr) — inexpensive, good indie coverage
- **Kenney.nl audio packs** — free, permissive license, cozy vibes

Budget: $50-150 for the full library. One evening of picking.

### 3.4 Sound Testing

Include a "Sound Test" hidden screen (accessible via 5-taps on the version number in Settings). Lists every sound with a play button. Used for QA and later audio tweaking.

---

## Part 4 — Animation Specification

### 4.1 Timing Constants

Use only these values from `motion.duration`:

- `instant: 100ms` — button press feedback
- `fast: 200ms` — toggle switches, cell fills
- `normal: 400ms` — screen transitions, toasts
- `slow: 600ms` — page turns, stamp entries
- `epic: 800ms` — polaroid drop, completion animations

### 4.2 Easing Constants

Two curves cover 95% of cases:

- `easeOut: cubic-bezier(0.22, 1, 0.36, 1)` — for everything by default
- `springy: cubic-bezier(0.34, 1.56, 0.64, 1)` — for playful moments (polaroid, stamp)

Reanimated 3 native: `withSpring({damping: 15, stiffness: 100})` for spring physics — used only for polaroid.

### 4.3 Animation Choreography (from screen specs)

**Puzzle → Reveal choreography:**
```
t=0ms:    Puzzle screen dims (opacity 1 → 0.3)
t=500ms:  "SIGHTING CONFIRMED" stamp scale-in (0.5s springy)
t=1000ms: Polaroid drops from -300px above (0.8s springy)
t=1400ms: Field entry card fades in (0.4s ease-out)
t=1800ms: "ADD TO GUIDE" button fades in (0.4s ease-out)
```

**Region unlock choreography (after purchase):**
```
t=0ms:    "UNLOCKED" stamp appears center screen (0.4s springy)
t=800ms:  Modal begins to fade
t=800ms:  Behind: world map pin lights up (candle-glow, 1s)
t=1500ms: Modal fully dismissed
```

**Book tap on home:**
```
t=0ms:    Book scale 1 → 0.97 (0.1s)
t=100ms:  Book fades to 0 (0.3s)
t=200ms:  Regions screen slides in from below (0.4s)
```

### 4.4 Performance Rules

- All animations MUST run on the native thread via Reanimated 3
- No JavaScript-thread animations (e.g., `Animated` API — reject any use)
- Target 60fps on iPhone SE (2020) and Pixel 6a (mid-range Android)
- If any screen drops below 45fps in profiling, it's a bug

### 4.5 What Not to Animate

Restraint. Not everything needs to move:
- Text does not fade in on every screen load
- Buttons do not bounce continuously
- Cells do not have hover-glow effects
- Backgrounds do not have ambient particle systems

The style guide's aesthetic is "aged notebook, quietly atmospheric." Excessive animation breaks that.

---

## Part 5 — Performance Guardrails

Repeat from DATA_AND_ENGINE with expanded QA context:

### 5.1 Metrics Table

| Metric | Target | Hard limit | How to measure |
|---|---|---|---|
| App cold start | < 1.5s | < 3.0s | Xcode Instruments / Android Studio profiler |
| Home → puzzle load | < 300ms | < 800ms | Manual stopwatch on real device |
| Puzzle grid tap response | < 16ms | < 33ms | Reanimated performance monitor |
| Puzzle solve check | < 5ms | < 20ms | Jest performance test |
| Save state write | < 50ms | < 200ms | Log-based |
| Content load into memory | < 20MB | < 40MB | Xcode memory profiler |
| Puzzle memory footprint | < 8KB | < 32KB | Custom instrumentation |

### 5.2 Optimization Approach

Optimize by measurement, not intuition. Run the profiler before assuming something is slow.

Common wins if measurements show issues:
- Memoize expensive components with `React.memo` and stable prop identities
- Use `useCallback` for callbacks passed to memoized children
- Lazy-load region content (don't load all 4 at app start)
- Use `FlatList` for the puzzle list (already tens of items)
- Split large images into progressive assets

Common time-wasters (do NOT premature-optimize):
- Adding memoization to trivially-fast components
- Splitting bundles by screen
- Custom Reanimated worklets for non-critical paths

### 5.3 Bundle Size Targets

- iOS: total download < 30MB
- Android: APK < 30MB, AAB < 25MB

If bundle exceeds these, first suspects:
- Uncompressed images (use `expo-optimize`)
- Bundled fonts not subset (use only the glyphs you need)
- Content JSONs shipped uncompressed (they're small anyway, but check)
- Unused dependencies

---

## Part 6 — Error Handling Patterns

### 6.1 The Three Categories of Errors

**Recoverable — try again silently.** Network hiccup during purchase restore, storage write fails. Retry once with backoff, then fall through to next category.

**Recoverable — surface to user.** Purchase fails, restore purchases returns nothing. Show toast with human-readable message and action.

**Unrecoverable — degrade gracefully.** Content JSON corrupted, save state unparseable. Log to Sentry, show fallback UI, provide "Report a bug" action.

### 6.2 Error Boundaries

Every screen wrapped in an error boundary component (`/src/components/ErrorBoundary.tsx`):

```typescript
<ErrorBoundary fallback={<ScreenErrorFallback />}>
  <HomeScreen />
</ErrorBoundary>
```

`ScreenErrorFallback` renders: sad-face field-guide illustration, "Something went wrong on this page. It's not your fault." message, "Return home" button, "Report bug" button that emails support with logs.

### 6.3 Async Error Handling

Every `await` inside a component wrapped in try/catch. Every store action that touches AsyncStorage or IAP APIs wrapped in try/catch. No uncaught promise rejections in production.

### 6.4 Sentry Setup

Free tier is enough:

```typescript
// /src/utils/sentry.ts
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 0.1,  // 10% of transactions
  enableAutoSessionTracking: true,
});
```

Wrap the app in `Sentry.wrap(App)` at root.

Custom error context:
- User's app version
- Save state version
- Reduce motion setting
- Number of solved puzzles
- Currently viewed screen

Never log PII (there's no PII in this app anyway — no accounts, no location).

---

## Part 7 — EAS Build & Deployment

### 7.1 Prerequisites

- Apple Developer Program membership ($99/yr) — needed to code sign and submit
- Google Play Console account ($25 one-time) — needed to publish on Android
- EAS account (free tier for solo devs is fine)
- App Store Connect app record created
- Google Play Console app record created
- RevenueCat account with products configured

### 7.2 `eas.json` Configuration

```json
{
  "cli": {
    "version": ">= 5.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "resourceClass": "m-medium" }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_ENVIRONMENT": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      },
      "android": {
        "serviceAccountKeyPath": "./secrets/google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### 7.3 Build Commands Cheat Sheet

```bash
# Development (Expo Go)
npx expo start

# Preview builds (TestFlight / internal Play)
eas build --profile preview --platform all

# Production builds
eas build --profile production --platform all

# Submit to stores after successful build
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

### 7.4 Version Numbering

- `version` in `app.json` = user-facing version (semantic: `1.0.0`, `1.1.0`, `2.0.0`)
- `buildNumber` (iOS) / `versionCode` (Android) auto-increments per build

Bump `version` per this pattern:
- **Patch (1.0.1):** bug fixes only
- **Minor (1.1.0):** new content pack, new feature
- **Major (2.0.0):** rare, reserved for significant redesign

### 7.5 Code Signing

iOS: EAS Build handles automatically after first-time `eas credentials` setup. Choose "let EAS manage" — do not manage certificates yourself.

Android: EAS Build generates keystore automatically. Back up via `eas credentials`. **Do not lose this keystore** — losing it means you can never update your app.

### 7.6 TestFlight Setup

1. First production build uploads automatically to TestFlight
2. Add internal testers via App Store Connect (up to 100)
3. Fill out beta test info (what to test, feedback email)
4. Submit for external testing (up to 10,000)
5. External testing needs Apple's review (~24h first time, seconds after)

TestFlight builds expire after 90 days. Ship a new preview build monthly during beta.

### 7.7 Play Internal Testing Setup

1. First production build uploads to Internal testing track
2. Add testers by email via Play Console
3. Testers get an opt-in link, install via Play Store
4. Promote to Closed or Open testing later
5. Testing tracks do not expire

---

## Part 8 — Store Submission

### 8.1 Pre-Submission Checklist

Run through this list before hitting Submit:

**iOS:**
- [ ] App name matches Developer Program name (per `listing_copy.md`)
- [ ] Bundle ID registered in Apple Developer Portal
- [ ] Certificates and provisioning profiles current
- [ ] All required screenshots uploaded (6.7" and 6.1")
- [ ] App icon uploaded at 1024×1024
- [ ] Subtitle at 29 chars
- [ ] Keyword string at 99 chars
- [ ] Description at 3,861 chars, first 160 chars land the value prop
- [ ] "What's New" v1 notes written
- [ ] Privacy Policy URL live at picrosscryptozoology.app/privacy
- [ ] Support URL live at picrosscryptozoology.app/contact
- [ ] Age rating questionnaire completed (targets 4+)
- [ ] Content rights confirmed (all art original or properly licensed)
- [ ] Encryption declaration (uses standard encryption)
- [ ] IAP products configured with SEO-optimized names (per aso_strategy.md)
- [ ] TestFlight beta run complete, no critical bugs

**Android:**
- [ ] Package name registered
- [ ] Signing key configured and backed up
- [ ] All required screenshots uploaded (phone and 7-inch tablet minimum)
- [ ] App icon at 512×512 (Play Store) and adaptive icon in-app
- [ ] Feature graphic 1024×500
- [ ] Short description at 73/80 chars
- [ ] Full description at 3,650 chars with long-tail phrases
- [ ] Content rating questionnaire completed
- [ ] Data safety form completed (no data collected)
- [ ] IAP products configured
- [ ] Internal testing complete

### 8.2 Timeline Expectations

- iOS review: usually 24-48h for straightforward apps. Occasionally 5+ days if flagged.
- Android review: usually a few hours for internal, 3-7 days for production.
- First submission takes longer than updates.

**Plan for slippage.** Submit 10+ days before your target launch date.

### 8.3 Common Rejection Reasons and Mitigations

**Apple:**

- **"App uses non-public API"** — Won't hit us; we use Expo which is App Store-safe.
- **"Missing metadata"** — Cover with the pre-submission checklist.
- **"Guideline 4.3 — Design Spam"** — Sometimes hits nonogram apps for looking similar to others. Distinguish via the cryptid theme and screenshots emphasizing that.
- **"Guideline 3.1.1 — In-App Purchase"** — Ensure all unlockable content is behind IAP, not just links.
- **"Guideline 2.5.1 — Accessibility"** — Uncommon rejection, but WCAG AA compliance is our shield.

**Android:**

- **"Deceptive Behavior"** — Ensure app name and screenshots accurately describe the app.
- **"Restricted Content"** — Age rating must match content. 4+ / Everyone requires we hold to atmospheric-only horror.
- **"User Data / Data Safety mismatch"** — Data safety form must exactly reflect what the app does.

### 8.4 Post-Rejection Response

If rejected:
1. Read the rejection carefully, twice
2. If you disagree, appeal via Resolution Center with specific reference to guideline text
3. If you agree, fix the issue and resubmit
4. Never argue emotionally with the reviewer — professional and factual only
5. Response usually within 48h

---

## Part 9 — Post-Launch Operations

### 9.1 Week 1 — Firewatch

Check these daily:

- Sentry dashboard: any new crash types?
- App Store Connect: sales, downloads, ratings breakdown
- Play Console: ratings, crashes, ANRs
- Reddit posts: reply to every comment within 30 min

Ship a v1.0.1 hotfix by end of week 2 for any critical issues found.

### 9.2 Month 1 — Baseline

- Weekly review of App Analytics search terms — what are people finding you for?
- Compare against your `aso_strategy.md` bets
- Kill keyword field entries getting zero impressions
- Add newly-discovered terms

### 9.3 Ongoing (per QA_AND_LAUNCH policy)

- Sentry monitored daily for first month, weekly thereafter
- Ratings responded to (or at least noted) weekly
- Reviews analyzed monthly for content-improvement themes
- ASO iteration quarterly

### 9.4 Update Cadence

Per the build calendar, twice a year:
- Fall (mid-September): Halloween update
- Spring (March-April): new region

Plus emergency patches as needed. Never let more than 90 days go by without an update — App Store algorithms mark stale apps.

### 9.5 Support Volume Expectations

For an app at $50-500/mo revenue:
- ~1-3 support emails per week
- ~5-10% will be genuine bugs, rest is user error
- ~1-2 App Store reviews per week
- Respond to negative reviews (nicely, briefly) — Apple weights response rate

Budget: 1-2 hours per week for support. Set up templates for common responses.

---

## Part 10 — The Definition of Done

An app version is "done" and ready to ship when:

- [ ] All planned features implemented per SCREEN_SPECS.md
- [ ] All unit tests pass; coverage ≥ 80% (engine ≥ 95%)
- [ ] All content validation passes
- [ ] Manual QA checklist passed on iOS + Android device
- [ ] No P0/P1 bugs open in tracker
- [ ] All strings reviewed for typos and voice consistency
- [ ] Every screen accessibility-audited with VoiceOver
- [ ] Performance metrics within targets
- [ ] Bundle size under limits
- [ ] Store metadata complete
- [ ] Privacy Policy and Support pages live
- [ ] TestFlight/Internal Testing feedback triaged
- [ ] Version numbers bumped
- [ ] Git tag created for the release
- [ ] Change log updated

Ship it.

---

*End of QA_AND_LAUNCH.md. Every operational concern from testing through post-launch is documented here. This is the doc Claude Code references when preparing a build for submission and when triaging live issues.*
