/**
 * Mindful Kids design system.
 *
 * Usage:
 * - colors: palette and semantic colors
 * - typography: text styles (h1, h2, body, subtitle, caption, label, etc.)
 * - spacing: xs, sm, md, lg, xl, xxl
 * - borderRadius: sm, md, lg, full
 */

export { colors } from './colors';
export type { Colors } from './colors';

export { spacing, borderRadius } from './spacing';

export { typography } from './typography';
export type { TypographyStyle } from './typography';

// Design tokens for consistent layout
export const layout = {
  screenPadding: 16,
  cardPadding: 16,
  sectionGap: 24,
  listItemGap: 12,
} as const;
