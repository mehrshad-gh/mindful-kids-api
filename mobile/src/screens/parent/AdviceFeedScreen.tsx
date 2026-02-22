import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export function AdviceFeedScreen() {
  return (
    <ScreenLayout>
      <Text style={styles.title}>Advice Feed</Text>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Daily & general advice</Text>
        <Text style={styles.cardDesc}>Evidence-based tips for parenting and child wellbeing.</Text>
      </Card>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  card: { marginBottom: spacing.md },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  cardDesc: { color: colors.textSecondary, marginTop: spacing.xs },
});
