/**
 * Mindful Kids – premium design system palette.
 * High contrast, accessible, distinctive. Works in light mode.
 */
export const colors = {
  // Brand & primary actions
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primaryHover: '#0F766E',
  primaryLight: '#CCFBF1',
  primaryMuted: '#CCFBF1',
  secondary: '#B45309',
  // Surfaces
  background: '#FAFAF9',
  backgroundElevated: '#F5F5F4',
  surface: '#FFFFFF',
  surfaceMuted: '#FEFEFE',
  surfaceSubtle: '#F5F5F4',
  // Text – high contrast
  text: '#18181B',
  textSecondary: '#52525B',
  textTertiary: '#A1A1AA',
  textInverse: '#FFFFFF',
  // Borders
  border: '#E7E5E4',
  borderFocus: '#0D9488',
  // Semantic
  success: '#059669',
  successMuted: '#D1FAE5',
  warning: '#D97706',
  warningMuted: '#FEF3C7',
  error: '#DC2626',
  errorMuted: '#FEE2E2',
  info: '#0284C7',
  infoMuted: '#E0F2FE',
  // Status badges
  badgePending: '#E0F2FE',
  badgeApproved: '#D1FAE5',
  badgeRejected: '#FEE2E2',
  badgeSuspended: '#FEF3C7',
  badgeDraft: '#F5F5F4',
  // Accents (child/parent flows)
  childAccent: '#7C3AED',
  childAccentMuted: '#EDE9FE',
  parentAccent: '#0369A1',
  parentAccentMuted: '#E0F2FE',
} as const;

export type Colors = typeof colors;
