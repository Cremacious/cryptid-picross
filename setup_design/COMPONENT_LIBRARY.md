# COMPONENT_LIBRARY.md
### Picross: Cryptozoology — Full Component API Specification

*Every component in the app, spec'd with a TypeScript props interface, visual states, event handlers, composition rules, and accessibility requirements. Claude Code should generate a matching `.tsx` file for each component below, and Claude Design should produce a matching mockup in `/design/components/`.*

---

## Design System Quick Reference

Before implementing any component, import from `/src/theme`:

```typescript
import { colors, typography, spacing, motion, layout } from '@/theme';
```

**Rule:** never inline color, spacing, or font values. If a value doesn't exist in the tokens file, add it there first.

**Reference the full token values** in `/design/DESIGN_TOKENS.md`.

---

## Part 1 — Atoms (Single-Purpose Primitives)

Atoms hold no state. They accept props and render. They are the vocabulary from which everything else is composed.

### 1.1 `Button`

**Purpose:** primary tappable action with text label.

**Props:**
```typescript
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;      // defaults to `label`
  accessibilityHint?: string;
  testID?: string;
}
```

**Variants:**
- `primary` — ink-primary background, paper-cream text. The default action.
- `secondary` — transparent background, ink-primary border, ink-primary text. Alternate actions.
- `danger` — warning-red border, warning-red text. Destructive actions ("Clear all data").

**States:** default, pressed (scale 0.97), disabled (opacity 0.4), loading (spinner replaces label).

**Size mapping:** `sm` = 32pt height, `md` = 44pt (default), `lg` = 56pt. All ≥ 44pt touch target regardless of size prop.

**Font:** `typography.fontFamily.display` (Special Elite), letterSpacing.wider.

**Motion:** scale 1 → 0.97 on press, duration `motion.duration.instant`, easing `easing.easeOut`.

**Haptics:** `expo-haptics` light impact on press.

**Accessibility:** `accessibilityRole="button"`, native disabled state respected.

**Never use for:** navigation-only actions (use `IconButton` or NavLink), tool selection in the puzzle toolbar (use `ToolButton`).

### 1.2 `IconButton`

**Purpose:** tappable icon with no text label. Used for back arrows, settings gear, tool selection.

**Props:**
```typescript
interface IconButtonProps {
  icon: IconName;                    // string enum of available icons
  onPress: () => void;
  variant?: 'default' | 'active' | 'ghost';
  size?: number;                     // pixel size of icon, defaults to 24
  disabled?: boolean;
  accessibilityLabel: string;        // REQUIRED for icon-only buttons
  accessibilityHint?: string;
  testID?: string;
}
```

**Icon inventory** (paper-drawn illustration style, never geometric):
```typescript
type IconName =
  | 'back' | 'settings' | 'close' | 'menu'
  | 'undo' | 'redo' | 'hint' | 'pause'
  | 'fill' | 'mark' | 'check'
  | 'pin' | 'book' | 'polaroid' | 'lantern'
  | 'lock' | 'unlock' | 'star';
```

**Container:** 44×44pt minimum touch target, even if icon is smaller.

**Variants:**
- `default` — paper-aged circular background, ink-primary icon
- `active` — ink-primary background, paper-cream icon (used for selected tool)
- `ghost` — no background, ink-soft icon (used for subtle nav)

**Accessibility:** MUST provide `accessibilityLabel`. Never rely on the icon alone.

### 1.3 `Stamp`

**Purpose:** the rotated "REDACTED" / "CASE OPEN" / "SIGHTING CONFIRMED" label.

**Props:**
```typescript
interface StampProps {
  text: string;
  color?: 'red' | 'candle' | 'ink';
  rotation?: number;                 // degrees, defaults to -4
  size?: 'sm' | 'md' | 'lg';
  animateIn?: boolean;               // dramatic scale-in on mount
}
```

**Visual:** letter-spaced (widest), border in the same color as text, rotated slightly. Fixed padding of `spacing.xs spacing.md`.

**Motion:** if `animateIn`, use spring physics — scale from 3 → 0.9 → 1 over `motion.duration.slow`.

**Font:** `typography.fontFamily.display`, all-caps.

**Usage examples:** "REDACTED" (red), "SIGHTING CONFIRMED" (red, animate), "COMING SOON" (ink), "NEW BEST" (candle).

### 1.4 `Divider`

**Purpose:** the dashed horizontal line used between sections.

**Props:**
```typescript
interface DividerProps {
  color?: string;                    // defaults to inkFaded
  spacing?: keyof typeof spacing;    // vertical margin, default 'md'
  style?: 'dashed' | 'solid' | 'double';  // dashed is default
}
```

**Rule:** solid lines are almost never appropriate in this app — they feel too clinical. Prefer dashed.

### 1.5 `PaperSurface`

**Purpose:** wraps children in a textured paper background. Every card, panel, and menu uses this — nothing floats over transparent backgrounds.

**Props:**
```typescript
interface PaperSurfaceProps {
  children: React.ReactNode;
  variant?: 'cream' | 'aged' | 'stained';
  elevated?: boolean;                // adds subtle shadow
  padding?: keyof typeof spacing;
  regionTint?: string;               // hex, overlaid at 8-15% opacity
  style?: ViewStyle;
}
```

**Texture:** three layered radial-gradient backgrounds that simulate paper grain. Since React Native doesn't support CSS gradients directly, use `expo-linear-gradient` for a base and a low-opacity noise texture image for grain (`/assets/images/paper-noise.png`, 512×512, tileable).

**Elevation:** if `elevated`, apply a soft warm shadow: `shadowColor: '#8A7443'`, offset `{0, 2}`, opacity `0.15`, radius `6`.

---

## Part 2 — Molecules (Composed, Limited Local State)

Molecules combine atoms and may hold small local state (hover, animation progress). They receive their data via props.

### 2.1 `PuzzleCell`

**Purpose:** individual cell in the puzzle grid. Renders empty/filled/marked/wrong states.

**Props:**
```typescript
interface PuzzleCellProps {
  state: PlayCell;                   // 0 | 1 | 2
  isWrong?: boolean;                 // only in Cozy mode
  size: number;                      // pixel size of cell edge
  onPress: () => void;
  boldRight?: boolean;               // for 5x5 grid dividers
  boldBottom?: boolean;
  testID?: string;
}
```

**States:**
- Empty: paper-cream background, thin grid-line border
- Filled: ink-primary background
- Marked: paper-aged background, small "×" glyph in warning-red
- Wrong: warning-red background (Cozy mode only)

**Motion:** on tap, brief scale 0.9 → 1.0 (100ms). If transitioning to `wrong`, add horizontal shake.

**Sound:** if filled correct — pencil scratch. If filled wrong — match strike. If marked — pen tap. (See QA_AND_LAUNCH sound design.)

**Haptics:** light impact on any state change.

**Perf:** memoize with `React.memo` — the puzzle grid may render 625 cells for 25×25 and re-render on every tap.

### 2.2 `TierBadge`

**Purpose:** small colored pill showing puzzle difficulty tier.

**Props:**
```typescript
interface TierBadgeProps {
  tier: Tier;                        // 'Easy' | 'Medium' | 'Hard' | 'Expert'
  size?: 'sm' | 'md';
}
```

**Color mapping:**
- Easy → `colors.pnwMoss`
- Medium → `colors.paperShadow`
- Hard → `colors.appalachiaRust`
- Expert → `colors.warningRed`

**Text:** all-caps tier name in `typography.fontFamily.display`, paper-cream color.

**Padding:** `2pt 8pt`. Border radius `2pt`. Never larger than 20pt tall.

### 2.3 `RegionCard`

**Purpose:** row in the region-select screen showing a region's swatch, name, progress, and lock state.

**Props:**
```typescript
interface RegionCardProps {
  region: Region;
  progress: {
    solved: number;
    total: number;
  };
  isLocked: boolean;                 // true if not purchased
  isComingSoon: boolean;             // true if future release
  onPress: () => void;
  testID?: string;
}
```

**Composition:** wraps children in `PaperSurface`, contains: color swatch (44×44 rounded), name (display font, `size.md`), progress text (body font, `size.xs`, `inkFaded`), lock icon or arrow chevron.

**States:** default, locked (opacity 0.45), coming-soon (dashed border, lock icon).

**Behavior:** if locked and tappable, tapping opens the paywall for that region. If coming-soon, tap is a no-op with a toast: "Available with the next update."

### 2.4 `PuzzleCard`

**Purpose:** row in the puzzle list within a region.

**Props:**
```typescript
interface PuzzleCardProps {
  puzzleNumber: number;              // 1-100
  puzzleName: string;                // "The Roadside Encounter" or "???" if unsolved
  size: string;                      // "10x8"
  tier: Tier;
  isSolved: boolean;
  bestTime?: number;                 // seconds, only if solved
  bestMistakes?: number;             // count, only if solved
  onPress: () => void;
  testID?: string;
}
```

**Composition:** `PaperSurface` (variant depends on solved state), contains: `SIGHTING 001` label, puzzle name (or "???"), grid size + `TierBadge`, best time row if solved, `✓` check on the right if solved.

**States:** unsolved (name hidden as "???"), solved (name shown, check visible, subtle green tint on surface).

### 2.5 `FieldEntryCard`

**Purpose:** the case file card that appears on the Reveal screen and Field Guide.

**Props:**
```typescript
interface FieldEntryCardProps {
  entry: FieldEntry;
  thumbnail?: Grid;                  // mini pixel-art preview
  variant?: 'reveal' | 'index';      // reveal = full detail, index = compact
}
```

**Composition:** `PaperSurface` with `variant='aged'`, contains: optional pixel-art thumbnail (rendered as CSS grid of 6×6 pixel cells), title (display font, `size.md`, letter-spaced), body (quote font italic, `size.md`, `lineHeight: 1.5`), voice-style-specific formatting (Victorian entries get "Dear Mr./Mrs." prefix rendered in a different font).

**Voice style hints:** the `entry.voiceStyle` prop affects only opening/closing decoration, never body formatting:
- `notebook` — no decoration
- `firstPerson` — dashed left border on body
- `victorian` — small "℘" glyph at top-right
- `deadpan` — no decoration

### 2.6 `Polaroid`

**Purpose:** the animated polaroid that drops in on puzzle completion, revealing the cryptid.

**Props:**
```typescript
interface PolaroidProps {
  grid: Grid;                        // the completed puzzle
  caption: string;                   // e.g., "Mothman · Silver Bridge"
  animateIn?: boolean;               // default true; triggers drop animation
  onAnimationComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';         // controls pixel size
}
```

**Visual:** white background, thick white bottom border (30pt), pixel-art grid rendered above, italic quote-font caption below.

**Motion:** `animateIn` triggers Reanimated 3 spring sequence: starts at `translateY: -300, rotate: -15deg, scale: 1.4, opacity: 0`, ends at `translateY: 0, rotate: -2deg, scale: 1, opacity: 1`. Duration `motion.duration.epic`, spring config `damping: 15, stiffness: 100`.

**Sound:** camera flash + shutter click at animation start.

**Rotation:** slight `-2deg` in resting state — never `0deg`. The tilt is the polaroid's personality.

### 2.7 `ModeToggle`

**Purpose:** the Cozy/Classic mode switcher on the Settings screen.

**Props:**
```typescript
interface ModeToggleProps {
  mode: 'cozy' | 'classic';
  onChange: (mode: 'cozy' | 'classic') => void;
}
```

**Composition:** two `Button`-like cards side by side (or stacked on narrow screens), each showing: mode name (display font), description (quote font italic), and the active one has ink-primary background.

**Behavior:** on select, calls `onChange` and shows a toast confirming the switch.

### 2.8 `WorldMapPin`

**Purpose:** interactive pin on the world map showing a region's location.

**Props:**
```typescript
interface WorldMapPinProps {
  regionId: string;
  x: number;                         // 0..100, percentage of map width
  y: number;                         // 0..100, percentage of map height
  isLocked: boolean;
  onPress: () => void;
}
```

**Visual:** 14pt circle with 2pt warning-red border, 50% white fill. Pulsing animation (scale 1 → 1.2 → 1, 2s loop). If locked, replace with a small lock icon at 50% opacity.

**Accessibility:** must have `accessibilityLabel` matching the region name.

---

## Part 3 — Organisms (Compound Components, Screen-Level Logic)

Organisms compose molecules and manage significant local state. They often coordinate with Zustand stores.

### 3.1 `PuzzleGrid`

**Purpose:** the entire interactive puzzle grid. Renders row/column clues, all cells, handles tap logic, detects wins.

**Props:**
```typescript
interface PuzzleGridProps {
  puzzle: Puzzle;
  mode: 'cozy' | 'classic';
  onWin: (time: number, mistakes: number) => void;
  onProgressChange?: (progress: number) => void;
}
```

**Local state (via `uiStore`):**
- `cellState: PlayGrid`
- `history: TapAction[]`
- `tool: 'fill' | 'mark'`
- `errors: number`

**Behavior:**
1. On mount: initialize `cellState` to all zeros, start timer.
2. On tap: call `uiStore.tap(r, c)`, which updates state and calls `checkWin`.
3. On win: call `onWin(time, errors)` and stop timer.
4. Renders row clues at left, column clues at top, cells in a `Grid` layout.

**Sizing:** compute cell size dynamically to fit screen width, capped between `layout.gridCellMin` and `layout.gridCellMax`. For 25×25 grids on small screens, wrap in `ScrollView`.

**Performance:** cells memoized. Row/column clues memoized. On tap, only the affected cell re-renders.

**Never nest inside another scrollable** — the grid uses its own gesture handler.

### 3.2 `WorldMap`

**Purpose:** hand-drawn parchment world map showing region pins.

**Props:**
```typescript
interface WorldMapProps {
  regions: Region[];
  progress: Record<string, { solved: number; total: number }>;
  purchases: PurchaseInfo;
  onRegionPress: (regionId: string) => void;
}
```

**Composition:** background image (`/assets/images/world-map-parchment.png` — a hand-drawn map at 1024×768), overlaid with `WorldMapPin` components positioned by lat/lng converted to percentages.

**Interactions:** pinch-to-zoom (react-native-gesture-handler), pan, tap on pin.

**Fallback:** if map image fails to load, render a stylized textual grid of regions instead. Never break.

### 3.3 `PuzzleToolbar`

**Purpose:** bottom bar with Fill / Mark / Undo / Hint tools + Check My Work (Classic mode).

**Props:**
```typescript
interface PuzzleToolbarProps {
  activeTool: 'fill' | 'mark';
  mode: 'cozy' | 'classic';
  onToolChange: (tool: 'fill' | 'mark') => void;
  onUndo: () => void;
  onHint: () => void;
  onCheckWork?: () => void;         // only in Classic mode
  canUndo: boolean;
  hintCount: number;                // remaining free hints
}
```

**Layout:** horizontal row of `IconButton`s. Fill and Mark are toggles (active state visible). Undo is disabled when `!canUndo`. Hint shows remaining count as a small badge.

**Classic mode:** insert a `Check My Work` `Button` above the icon row.

### 3.4 `SettingsPanel`

**Purpose:** the Settings screen contents. Grouped preferences.

**Props:** none — reads directly from `settingsStore`, `progressStore`, and `purchaseStore`.

**Sections:**
1. Investigation Style (contains `ModeToggle`)
2. Sound & Haptics (two toggle rows)
3. Accessibility (Reduce Motion toggle, Larger Cells toggle)
4. Field Data (stats + Clear All button)
5. Purchases (Restore Purchases button)
6. About (version, credits, links to Reddit + website)

Each section wrapped in `PaperSurface`. Sections separated by `Divider` with `spacing='lg'`.

---

## Part 4 — Accessibility Requirements (Every Component)

**Non-negotiable rules Claude Code must apply to every component:**

- Touch targets ≥ 44pt (Apple HIG) / 48dp (Material Design). Both hit for us at 44pt.
- Color contrast ≥ 4.5:1 for text against background (WCAG AA).
- All interactive elements have `accessibilityRole` set.
- Icon-only buttons MUST have `accessibilityLabel`.
- Grouped controls have `accessibilityHint` describing what they do together.
- Animation respects `settings.reduceMotion` OR system setting: if either is true, replace all motion with instant transitions.
- Text scales with dynamic type — never use `allowFontScaling={false}` unless technically necessary (grid clues might need it).
- All colors provide non-color-based alternatives: e.g., wrong cells shake in addition to turning red, so colorblind users can identify them.

Full accessibility audit spec lives in `QA_AND_LAUNCH.md` Section 3.

---

## Part 5 — The Component Development Cycle

For each component in this document, follow this exact sequence:

1. **Read the spec above** for the component.
2. **Read `/design/DESIGN_TOKENS.md`** for the values.
3. **Ask Claude Design** to produce a mockup at `/design/components/{componentName}.html` following the spec.
4. **Implement** the component in `/src/components/{atoms|molecules|organisms}/{ComponentName}.tsx`.
5. **Write a component test** in `/tests/components/{ComponentName}.test.tsx` covering:
   - Renders without crashing in every documented state
   - Snapshot matches design mockup structure
   - `onPress` / other events fire correctly
   - Accessibility roles/labels present
6. **Add to Storybook** (if using) at `/src/stories/{ComponentName}.stories.tsx` showing every variant.
7. **Commit** as `feat(components): implement {ComponentName}`.

Never implement a component without a matching design mockup. Never ship a component without a test. Never inline styles that could be tokens.

---

## Part 6 — Component Composition Rules

**Rules that apply across all components:**

- **No cross-atomic imports going the wrong way.** Atoms cannot import molecules or organisms. Molecules cannot import organisms. Organisms may import atoms and molecules.
- **No component imports another component's styles.** Styles are internal.
- **Never mix layout and styling props.** A component's props are semantic (`variant`, `size`, `disabled`) — not literal (`marginTop`, `backgroundColor`). If you need a one-off style adjustment, use the `style` prop escape hatch, but sparingly.
- **All async work goes through hooks.** Components never call AsyncStorage, IAP, or fetch directly. They call hooks that abstract those.
- **Every event handler is named `on{Verb}`.** Never `handleClick`, `doPress`, etc.

---

*End of COMPONENT_LIBRARY.md. Every component the app needs is spec'd here. New components require a new entry in this document before implementation.*
