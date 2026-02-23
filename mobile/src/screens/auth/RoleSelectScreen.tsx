import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { RootStackParamList } from '../../types/navigation';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'RoleSelect'> };

export function RoleSelectScreen({ navigation }: Props) {
  const { user, setAppRole } = useAuth();
  const isAdmin = user?.role === 'admin';

  const selectParent = () => {
    setAppRole('parent');
    navigation.replace('App');
  };

  const selectChild = () => {
    setAppRole('child');
    navigation.replace('App');
  };

  const selectAdmin = () => {
    setAppRole('admin');
    navigation.replace('App');
  };

  return (
    <ScreenLayout>
      <View style={styles.container}>
        <Text style={styles.title}>Choose how to use the app</Text>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Parent</Text>
          <Text style={styles.cardDesc}>Dashboard, advice, library, experts, and child progress.</Text>
          <Button title="Use as Parent" onPress={selectParent} style={styles.btn} />
        </Card>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Child</Text>
          <Text style={styles.cardDesc}>Activities, rewards, and calm tools.</Text>
          <Button title="Use as Child" onPress={selectChild} style={styles.btn} />
        </Card>
        {isAdmin && (
          <Card style={[styles.card, styles.adminCard]}>
            <Text style={styles.cardTitle}>Admin</Text>
            <Text style={styles.cardDesc}>Review therapist applications, assign verified badge.</Text>
            <Button title="Open verification" onPress={selectAdmin} style={styles.btn} />
          </Card>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  title: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: spacing.lg },
  card: { marginBottom: spacing.md },
  adminCard: { borderLeftWidth: 4, borderLeftColor: colors.primary },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  cardDesc: { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md },
  btn: { alignSelf: 'flex-start' },
});
