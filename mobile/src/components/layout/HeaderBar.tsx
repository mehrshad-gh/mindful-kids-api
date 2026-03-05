import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../design/colors';
import { typography } from '../../design/typography';
import { spacing } from '../../design/spacing';

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export function HeaderBar({ title, subtitle, style }: HeaderBarProps) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle != null && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  title: { ...typography.ScreenTitle, color: colors.textPrimary },
  subtitle: { ...typography.Caption, color: colors.textSecondary, marginTop: spacing.xs },
});
