import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export function PsychologistDirectoryScreen() {
  return (
    <ScreenLayout>
      <Text style={styles.title}>Psychologist Directory</Text>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Find experts</Text>
        <Text style={styles.cardDesc}>Browse and book psychologists with reviews.</Text>
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
