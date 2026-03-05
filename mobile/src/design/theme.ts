/**
 * MindfulKids design system – single export for colors, typography, spacing, radius, shadows.
 */
export { colors } from './colors';
export type { Colors } from './colors';

export { spacing } from './spacing';
export type { Spacing } from './spacing';

export { radius } from './radius';
export type { Radius } from './radius';

export { shadows } from './shadows';
export type { Shadows } from './shadows';

export { typography, fontWeights } from './typography';
export type { TypographyStyle } from './typography';

export const layout = {
  screenPadding: 24,
  screenPaddingWide: 28,
  cardPadding: 20,
  cardPaddingCompact: 16,
  sectionGap: 28,
  sectionGapSmall: 20,
  listItemGap: 12,
  maxContentWidth: 440,
  touchTargetMin: 48,
  fabSize: 56,
  fabBottomInset: 24,
  fabHorizontalMargin: 24,
  fabContentPaddingBottom: 88,
} as const;
