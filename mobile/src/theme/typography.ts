import { StyleSheet } from 'react-native';
import { colors } from './colors';

/**
 * Design system typography.
 * Warm, readable hierarchy for families.
 */
export const typography = StyleSheet.create({
  h1: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.4,
    lineHeight: 36,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    lineHeight: 16,
  },
  accent: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    lineHeight: 22,
  },
  error: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.error,
  },
  success: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.success,
  },
});

export type TypographyStyle = keyof typeof typography;
