import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  overline?: string;
  /** Optional left accent bar color */
  accentColor?: string;
}

export function SectionHeader({ title, subtitle, overline, accentColor }: SectionHeaderProps) {
  return (
    <View style={[styles.wrap, accentColor && styles.wrapAccent, accentColor && { borderLeftColor: accentColor }]}>
      {overline ? <Text style={styles.overline}>{overline}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md, paddingLeft: 0 },
  wrapAccent: { paddingLeft: spacing.md, borderLeftWidth: 4 },
  overline: { ...typography.overline, marginBottom: spacing.xs },
  title: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.subtitle, color: colors.textSecondary },
});
