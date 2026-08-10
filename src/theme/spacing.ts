/**
 * spacing.ts — 4-point spacing scale + corner radii.
 *
 * Radii stay small on purpose: this is paper and card stock, not glass.
 * Big rounded corners read as "generic mobile app"; 2–8pt reads as printed matter.
 */

/** 4-point base scale. Use these for margin, padding, and gaps everywhere. */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16, // default gutter
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

/** Corner radii — deliberately restrained. */
export const radius = {
  none: 0,
  xs: 2, // tier badges, stamps
  sm: 4, // cells, chips
  md: 8, // cards, buttons, surfaces
  lg: 12, // large panels (rare)
  full: 999, // pills, the world-map pins
} as const;

/** Border widths. Dashed is the house default (solid feels clinical). */
export const border = {
  hairline: 1,
  thin: 1.5,
  thick: 2,
} as const;

export type Spacing = typeof spacing;
export type Radius = typeof radius;
