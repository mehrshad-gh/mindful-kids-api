/**
 * MindfulKids design system – full-bleed, calm palette for families.
 * Edge-to-edge backgrounds; surfaces and cards with soft elevation.
 */
export const colors = {
  primary: '#4F7BF7',
  secondary: '#6DD4B4',
  accent: '#F5C042',
  success: '#22A06B',
  warning: '#E0922E',
  danger: '#D64545',
  background: '#ECF0F6',
  surface: '#FFFFFF',
  surfaceSoft: '#F4F6FB',
  border: 'rgba(0,0,0,0.06)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  domain_emotional_awareness: '#6C8CFF',
  domain_self_regulation: '#5FD0B6',
  domain_problem_solving: '#F9C74F',
  domain_social_connection: '#F4978E',
  domain_resilience: '#9C89FF',
  text: '#0F172A',
  textTertiary: '#94A3B8',
  primaryDark: '#3D6AE3',
  primaryLight: '#E8EEFE',
  primaryMuted: '#DCE5FD',
  surfaceSubtle: '#F0F4FA',
  surfaceMuted: '#ECF0F6',
  backgroundElevated: '#FFFFFF',
  borderFocus: '#4F7BF7',
  successMuted: '#D1FAE5',
  warningMuted: '#FEF3C7',
  error: '#D64545',
  errorMuted: '#FEE2E2',
  info: '#4F7BF7',
  infoMuted: '#E8EEFE',
  badgePending: '#E8EEFE',
  badgeApproved: '#D1FAE5',
  badgeRejected: '#FEE2E2',
  badgeSuspended: '#FEF3C7',
  badgeDraft: '#F4F6FB',
  childAccent: '#8B7CF6',
  childAccentMuted: '#EDE9FE',
  parentAccent: '#4F7BF7',
  parentAccentMuted: '#DCE5FD',
  parentHeaderStart: '#4F7BF7',
  parentHeaderEnd: '#6B8FF9',
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
