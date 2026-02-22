import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export function ActivityHubScreen() {
  const { setAppRole } = useAuth();

  return (
    <ScreenLayout>
      <Text style={styles.title}>Activity Hub</Text>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Choose an activity</Text>
        <Text style={styles.cardDesc}>Psychology-based activities: CPRT, CBT, DBT, ACT.</Text>
      </Card>
      <Button
        title="Back to Parent mode"
        onPress={() => setAppRole('parent')}
        variant="ghost"
        style={styles.switchBtn}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  card: { marginBottom: spacing.md },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  cardDesc: { color: colors.textSecondary, marginTop: spacing.xs },
  switchBtn: { marginTop: spacing.md },
});
