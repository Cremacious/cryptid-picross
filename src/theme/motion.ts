/**
 * motion.ts — animation durations, easing curves, spring configs.
 *
 * Source: QA_AND_LAUNCH.md Part 4. Only these values are allowed; do not
 * inline arbitrary durations or beziers. Respect reduce-motion by collapsing
 * every duration to 0 (see `reducedMotion` helper intent below).
 */

/** Durations (ms). Named by feel, not by number. */
export const duration = {
  instant: 100, // button press feedback
  fast: 200, // toggles, cell fills
  normal: 400, // screen transitions, toasts
  slow: 600, // page turns, stamp entries
  epic: 800, // polaroid drop, completion choreography
} as const;

/** Easing — two curves cover ~95% of cases. */
export const easing = {
  easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)', // default for everything
  springy: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // playful (polaroid, stamp)
} as const;

/** Reanimated 3 spring config — used for physical drops (polaroid). */
export const spring = {
  polaroid: { damping: 15, stiffness: 100 },
} as const;

/**
 * Choreography timelines (ms offsets), lifted from the screen specs so the
 * animation code and the design doc can never drift apart.
 */
export const choreography = {
  reveal: {
    dim: 0, // puzzle dims to 0.3
    stamp: 500, // "SIGHTING CONFIRMED" scale-in (springy, slow)
    polaroid: 1000, // drops from -300px (springy, epic)
    entry: 1400, // field entry fades in (easeOut, normal)
    button: 1800, // "ADD TO GUIDE" fades in (easeOut, normal)
  },
  regionUnlock: {
    stamp: 0, // "UNLOCKED" appears (springy, normal)
    modalFade: 800,
    pinGlow: 800, // candle-glow, ~1s
    done: 1500,
  },
  homeBookTap: {
    scaleDown: 0, // book 1 → 0.97 (instant)
    fadeOut: 100, // book fades (fast → normal)
    regionsIn: 200, // regions slide up (normal)
  },
} as const;

export const motion = {
  duration,
  easing,
  spring,
  choreography,
} as const;

export type Motion = typeof motion;
