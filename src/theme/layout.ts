/**
 * layout.ts — screen-level layout constants and the puzzle grid sizing bounds.
 *
 * Referenced by PuzzleGrid (dynamic cell sizing) and every screen's padding.
 */

export const layout = {
  /** Standard screen edge padding. */
  screenPadding: 16,

  /** Minimum touch target — Apple HIG 44pt / Material 48dp both satisfied. */
  touchTarget: 44,

  /** Puzzle grid cell sizing bounds (px). Cells scale to fit, clamped here. */
  gridCellMin: 14, // 25×25 on a small phone bottoms out here (then ScrollView)
  gridCellMax: 56, // 5×5 fills a phone; large grids clamp down to gridCellMin

  /** Home-screen field book (iPhone 6.7" reference). */
  book: { width: 260, height: 340 },

  /** Reveal polaroid bottom border (the thick white lip). */
  polaroidBorderBottom: 30,

  /** Max content width so tablets don't stretch the notebook uncomfortably. */
  maxContentWidth: 520,

  /** Toolbar / bottom-bar height. */
  toolbarHeight: 72,
} as const;

export type Layout = typeof layout;
