/**
 * Type scale – clear hierarchy, comfortable reading.
 * Uses system font stack; weights and size do the work.
 */
import { Platform } from 'react-native';
import { colors } from './colors';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const typography = {
  display: {
    fontSize: 34,
    fontWeight: fontWeights.bold,
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 41,
  },
  h1: {
    fontSize: 28,
    fontWeight: fontWeights.bold,
    color: colors.text,
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  h2: {
    fontSize: 22,
    fontWeight: fontWeights.bold,
    color: colors.text,
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: fontWeights.regular,
    color: colors.text,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 15,
    fontWeight: fontWeights.regular,
    color: colors.text,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: fontWeights.regular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: fontWeights.regular,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  overline: {
    fontSize: 11,
    fontWeight: fontWeights.semibold,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    lineHeight: 14,
  },
  link: {
    fontSize: 16,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
    lineHeight: 24,
  },
  error: {
    fontSize: 14,
    fontWeight: fontWeights.medium,
    color: colors.error,
  },
  success: {
    fontSize: 14,
    fontWeight: fontWeights.medium,
    color: colors.success,
  },
};

export type TypographyStyle = keyof typeof typography;
