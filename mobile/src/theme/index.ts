/**
 * Mindful Kids design system.
 * Warm, calm visual language – no logic changes.
 */

export { colors } from './colors';
export type { Colors } from './colors';

export { spacing, borderRadius } from './spacing';

export { typography } from './typography';
export type { TypographyStyle } from './typography';

export const layout = {
  screenPadding: 20,
  cardPadding: 20,
  sectionGap: 24,
  listItemGap: 12,
} as const;
