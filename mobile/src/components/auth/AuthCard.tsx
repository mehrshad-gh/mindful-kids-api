import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { layout } from '../../theme';
import { borderRadius, shadows } from '../../theme/spacing';

interface AuthCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function AuthCard({ children, style }: AuthCardProps) {
  return (
    <View style={[styles.floatingWrap, style]}>
      <View style={styles.cardWrap}>
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
});
