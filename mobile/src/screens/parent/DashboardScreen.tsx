import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { ParentTabParamList } from '../../types/navigation';

type Props = { navigation: NativeStackNavigationProp<ParentTabParamList, 'Dashboard'> };

export function DashboardScreen({ navigation }: Props) {
  const { user, setAppRole } = useAuth();

  return (
    <ScreenLayout>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Hello, {user?.name ?? 'Parent'}!</Text>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Quick actions</Text>
        <Text style={styles.cardDesc}>View advice, content library, and your child's progress.</Text>
      </Card>
      <Button
        title="Use app as Child"
        onPress={() => setAppRole('child')}
        variant="outline"
        style={styles.switchBtn}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: spacing.lg },
  card: { marginBottom: spacing.md },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  cardDesc: { color: colors.textSecondary, marginTop: spacing.xs },
  switchBtn: { marginTop: spacing.md },
});
