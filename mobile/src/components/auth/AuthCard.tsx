import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { layout } from '../../theme';
import { borderRadius, shadows } from '../../theme/spacing';

type AuthCardVariant = 'default' | 'glass';

interface AuthCardProps {
  children: React.ReactNode;
  variant?: AuthCardVariant;
  style?: ViewStyle;
}

export function AuthCard({ children, variant = 'default', style }: AuthCardProps) {
  return (
    <View style={[styles.floatingWrap, style]}>
      <View style={[styles.cardWrap, variant === 'glass' && styles.cardWrapGlass]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrap: {
    marginHorizontal: spacing.lg,
    marginTop: -spacing.xxl,
    marginBottom: spacing.lg,
  },
  cardWrap: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: layout.cardPadding,
    ...shadows.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardWrapGlass: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1.5,
    borderRadius: borderRadius.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 8,
  },
});
