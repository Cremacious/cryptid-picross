/**
 * colors.ts — the single source of truth for every color in the app.
 *
 * Rule (from COMPONENT_LIBRARY.md): never inline a color value anywhere.
 * If a color you need doesn't exist here, add it here first.
 *
 * Aesthetic: "aged notebook, quietly atmospheric." Warm paper backgrounds,
 * dark warm ink, muted oxblood accents. Saturated color enters only through
 * per-region tints. See design/DESIGN_TOKENS.md for rationale + contrast data.
 */

/** Paper — background surfaces, light → dark tonal ramp. */
const paper = {
  highlight: '#FBF4E2', // lifted surfaces, page edges, top of a gradient
  cream: '#F1E8D3', // app background (the base note)
  aged: '#E4D7BA', // cards, secondary surfaces
  stained: '#D2C09B', // pressed/inset states, tea-stain areas
  shadow: '#B7A47C', // borders, deep grain, dashed dividers
} as const;

/** Ink — text and filled cells. Contrast ratios are vs paper.cream. */
const ink = {
  primary: '#2B241B', // body text, filled cells — 11.2:1 (AAA)
  soft: '#4A3D2C', // secondary text — 7.4:1 (AAA)
  faded: '#7A6849', // tertiary/captions — 3.9:1 (large text only, ≥14pt bold / ≥18pt)
} as const;

/** Accents — used sparingly. Restraint here is what reads as "professional." */
const accent = {
  stampRed: '#9B3B2E', // stamps, Expert tier, destructive actions (muted oxblood)
  candleGlow: '#C98A3C', // "new best", unlock glow, subtle highlights
} as const;

/** Region tints — the one place saturated color lives; each region's identity. */
const region = {
  pnw: '#5D6B4E', // Pacific Northwest — moss
  appalachia: '#9C5A3C', // Appalachia — rust
  british: '#586A78', // British Isles — slate heather
  outback: '#B5793A', // Australian Outback — red ochre
} as const;

/** Difficulty tiers map onto the palette above (color + always a text label). */
const tier = {
  Easy: region.pnw,
  Medium: paper.shadow,
  Hard: region.appalachia,
  Expert: accent.stampRed,
} as const;

/** Feedback / semantic. */
const feedback = {
  wrong: accent.stampRed, // wrong cell (Cozy mode). Always paired with shake + sound.
  success: region.pnw, // solved tint on cards
  warning: accent.stampRed,
} as const;

/** Puzzle cell surfaces. */
const cell = {
  empty: paper.cream,
  emptyBorder: paper.shadow,
  filled: ink.primary,
  marked: paper.aged,
  markGlyph: accent.stampRed,
  wrong: accent.stampRed,
} as const;

/** Warm shadow — never a cold gray drop-shadow. Big part of the "cozy but polished" feel. */
const shadow = {
  color: '#8A7443',
  // React Native shadow recipe for `elevated` surfaces:
  // shadowColor: shadow.color, shadowOffset {0,2}, shadowOpacity 0.15, shadowRadius 6
} as const;

export const colors = {
  paper,
  ink,
  accent,
  region,
  tier,
  feedback,
  cell,
  shadow,

  // Flat convenience aliases used widely across the specs:
  paperCream: paper.cream,
  paperAged: paper.aged,
  paperShadow: paper.shadow,
  inkPrimary: ink.primary,
  inkSoft: ink.soft,
  inkFaded: ink.faded,
  warningRed: accent.stampRed,
  candle: accent.candleGlow,
  pnwMoss: region.pnw,
  appalachiaRust: region.appalachia,
} as const;

export type Colors = typeof colors;
