/**
 * Mindful Kids – design system.
 * Premium, accessible, consistent across all screens.
 */
export { colors } from './colors';
export type { Colors } from './colors';

export { spacing, spacingLegacy, borderRadius, shadows } from './spacing';

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
  /** FAB: size, spacing from bottom (above safe area), and horizontal margin */
  fabSize: 56,
  fabBottomInset: 24,
  fabHorizontalMargin: 24,
  /** Extra bottom padding for screens that show a FAB so content isn't hidden */
  fabContentPaddingBottom: 88,
} as const;
