import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, shadows } from '../../theme/spacing';
import { layout } from '../../theme';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'glow' | 'domain' | 'glass';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: CardVariant;
  accentColor?: string;
  style?: ViewStyle;
}

export function Card({ children, title, subtitle, variant = 'default', accentColor, style }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        variant === 'glow' && styles.glow,
        variant === 'glass' && styles.glass,
        variant === 'domain' && accentColor && [styles.domain, { borderLeftColor: accentColor, backgroundColor: accentColor + '12' }],
        accentColor && variant !== 'domain' ? [styles.accent, { borderLeftColor: accentColor }] : undefined,
        style,
      ]}
    >
      {(title != null || subtitle != null) && (
        <View style={styles.header}>
          {title != null && <Text style={styles.title}>{title}</Text>}
          {subtitle != null && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: layout.cardPadding,
    borderWidth: 0,
    ...shadows.card,
  },
  elevated: {
    ...shadows.elevated,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  glow: {
    ...shadows.glow,
    borderWidth: 0,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.08,
    shadowRadius: 36,
    elevation: 10,
  },
  accent: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  domain: {
    borderLeftWidth: 4,
  },
  header: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.CardTitle,
    color: colors.text,
  },
  subtitle: {
    ...typography.Caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
