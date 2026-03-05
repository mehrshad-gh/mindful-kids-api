/**
 * Re-export design system spacing, radius, shadows (single source of truth: design/).
 */
import { spacing as designSpacing } from '../design/spacing';

export const spacing = designSpacing;
export type { Spacing } from '../design/spacing';
export const spacingLegacy = designSpacing;

export { radius } from '../design/radius';
export type { Radius } from '../design/radius';

export { shadows } from '../design/shadows';
export type { Shadows } from '../design/shadows';

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;
