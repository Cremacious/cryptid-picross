/**
 * theme/index.ts — the barrel. Import everything from '@/theme'.
 *
 *   import { colors, typography, spacing, radius, motion, layout } from '@/theme';
 *
 * Never import a color/size/duration from anywhere else. If a value is missing,
 * add it to the appropriate module here first (see design/DESIGN_TOKENS.md).
 */

export { colors } from './colors';
export type { Colors } from './colors';

export { typography } from './typography';
export type { Typography } from './typography';

export { spacing, radius, border } from './spacing';
export type { Spacing, Radius } from './spacing';

export { motion, duration, easing, spring, choreography } from './motion';
export type { Motion } from './motion';

export { layout } from './layout';
export type { Layout } from './layout';
