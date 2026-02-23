import { StyleSheet } from 'react-native';
import { colors } from './colors';

/**
 * Design system typography.
 * Use these styles for consistent headings, body, labels, and captions.
 */
export const typography = StyleSheet.create({
  // Screen / section titles
  h1: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  // Body
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
  // Supporting
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
    letterSpacing: 0.5,
  },
  // Semantic
  accent: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.primary,
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
