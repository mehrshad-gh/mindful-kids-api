/**
 * MindfulKids design system – calm, modern palette for families and children.
 */
export const colors = {
  primary: '#5B8DEF',
  secondary: '#7ED9B6',
  accent: '#F9C74F',
  success: '#6ED3A6',
  warning: '#F4A261',
  danger: '#E76F51',
  background: '#F7F9FC',
  surface: '#FFFFFF',
  surfaceSoft: '#EEF3FF',
  border: '#E3E8F2',
  textPrimary: '#1F2A37',
  textSecondary: '#667085',
  textMuted: '#98A2B3',
  textInverse: '#FFFFFF',
  domain_emotional_awareness: '#6C8CFF',
  domain_self_regulation: '#5FD0B6',
  domain_problem_solving: '#F9C74F',
  domain_social_connection: '#F4978E',
  domain_resilience: '#9C89FF',
  text: '#1F2A37',
  textTertiary: '#98A2B3',
  primaryDark: '#4A7BD9',
  primaryLight: '#E8F0FE',
  primaryMuted: '#E8F0FE',
  surfaceSubtle: '#EEF3FF',
  surfaceMuted: '#F7F9FC',
  backgroundElevated: '#FFFFFF',
  borderFocus: '#5B8DEF',
  successMuted: '#E6FAF0',
  warningMuted: '#FEF3E6',
  error: '#E76F51',
  errorMuted: '#FDEDEA',
  info: '#5B8DEF',
  infoMuted: '#E8F0FE',
  badgePending: '#E8F0FE',
  badgeApproved: '#E6FAF0',
  badgeRejected: '#FDEDEA',
  badgeSuspended: '#FEF3E6',
  badgeDraft: '#F7F9FC',
  childAccent: '#9C89FF',
  childAccentMuted: '#EEF0FF',
  parentAccent: '#5B8DEF',
  parentAccentMuted: '#E8F0FE',
} as const;

export type Colors = typeof colors;

const DOMAIN_IDS = [
  'emotional_awareness',
  'self_regulation',
  'problem_solving',
  'social_connection',
  'resilience',
] as const;

export function getDomainColor(domainId: string): string {
  const key = `domain_${domainId}` as keyof Colors;
  return key in colors ? (colors[key] as string) : colors.primary;
}
