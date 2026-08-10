/**
 * typography.ts — fonts, sizes, weights, line-heights, letter-spacing.
 *
 * Two families only (bundle-friendly, both free Google Fonts, subsettable):
 *  - display: "Special Elite"  — stamped-typewriter. Headers, stamps, buttons,
 *             labels, tier badges. Used all-caps + wide tracking for the
 *             "case file" feel. Poor for long paragraphs.
 *  - body:    "Courier Prime"  — clean, readable typewriter. Case-file prose,
 *             UI copy, captions (italic). Keeps the "typed report" concept
 *             while staying legible at paragraph length.
 *
 * Load via expo-font. Fall back to system monospace so text never disappears.
 */

const fontFamily = {
  display: 'SpecialElite_400Regular',
  body: 'CourierPrime_400Regular',
  bodyItalic: 'CourierPrime_400Italic',
  bodyBold: 'CourierPrime_700Bold',
  // Fallback stacks for web mockups / FOUT safety:
  displayFallback: "'Special Elite', 'Courier New', monospace",
  bodyFallback: "'Courier Prime', 'Courier New', monospace",
} as const;

/** Type scale (pt). Everything else is derived from these. */
const size = {
  xs: 12, // captions, tertiary labels
  sm: 14, // secondary text, metadata
  md: 16, // body default
  lg: 20, // section headers, card titles
  xl: 26, // screen titles
  '2xl': 34, // hero / display moments (stamps, completion)
} as const;

/** Line-height multipliers (unitless, multiply by size). */
const lineHeight = {
  tight: 1.15, // display headers
  snug: 1.35, // titles
  normal: 1.5, // body prose (case files)
} as const;

/** Letter-spacing (pt). Display type leans wide; body stays neutral. */
const letterSpacing = {
  normal: 0,
  wide: 1.5, // buttons, labels
  wider: 2.5, // tier badges, small caps
  widest: 4, // stamps ("SIGHTING CONFIRMED")
} as const;

const weight = {
  regular: '400',
  bold: '700',
} as const;

/**
 * Ready-made text roles — compose these instead of assembling props each time.
 * (fontFamily values reference the loaded RN font names.)
 */
const role = {
  stamp: {
    fontFamily: fontFamily.display,
    fontSize: size['2xl'],
    lineHeight: size['2xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase' as const,
  },
  screenTitle: {
    fontFamily: fontFamily.display,
    fontSize: size.xl,
    lineHeight: size.xl * lineHeight.tight,
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase' as const,
  },
  cardTitle: {
    fontFamily: fontFamily.display,
    fontSize: size.lg,
    lineHeight: size.lg * lineHeight.snug,
    letterSpacing: letterSpacing.wide,
  },
  label: {
    fontFamily: fontFamily.display,
    fontSize: size.sm,
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontFamily: fontFamily.display,
    fontSize: size.md,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: size.md,
    lineHeight: size.md * lineHeight.normal,
  },
  bodyItalic: {
    fontFamily: fontFamily.bodyItalic,
    fontStyle: 'italic' as const,
    fontSize: size.md,
    lineHeight: size.md * lineHeight.normal,
  },
  caption: {
    fontFamily: fontFamily.bodyItalic,
    fontStyle: 'italic' as const,
    fontSize: size.sm,
    lineHeight: size.sm * lineHeight.normal,
  },
} as const;

export const typography = {
  fontFamily,
  size,
  lineHeight,
  letterSpacing,
  weight,
  role,
} as const;

export type Typography = typeof typography;
