import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { layout } from '../../theme';
import type { RootStackParamList } from '../../types/navigation';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'RoleSelect'> };

export function RoleSelectScreen({ navigation }: Props) {
  const { user, setAppRole, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTherapist = user?.role === 'therapist';

  const selectParent = () => { setAppRole('parent'); navigation.replace('App'); };
  const selectChild = () => { setAppRole('child'); navigation.replace('App'); };
  const selectTherapist = () => { setAppRole('therapist'); navigation.replace('App'); };
  const selectAdmin = () => { setAppRole('admin'); navigation.replace('App'); };

  return (
    <ScreenLayout centered>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>How would you like to use the app?</Text>
        <Text style={styles.heroSubtitle}>Choose a mode to continue.</Text>
      </View>
      {isTherapist && (
        <Card style={styles.card} variant="elevated" accentColor={colors.primary}>
          <Text style={styles.cardTitle}>Therapist</Text>
          <Text style={styles.cardDesc}>View your application status and professional profile.</Text>
          <Button title="Use as therapist" onPress={selectTherapist} fullWidth style={styles.btn} />
        </Card>
      )}
      <Card style={styles.card} variant="elevated" accentColor={colors.parentAccent}>
        <Text style={styles.cardTitle}>Parent</Text>
        <Text style={styles.cardDesc}>Dashboard, advice, library, experts, and child progress.</Text>
        <Button title="Use as parent" onPress={selectParent} fullWidth style={styles.btn} />
      </Card>
      <Card style={styles.card} variant="elevated" accentColor={colors.childAccent}>
        <Text style={styles.cardTitle}>Child</Text>
        <Text style={styles.cardDesc}>Activities, rewards, and calm tools.</Text>
        <Button title="Use as child" onPress={selectChild} fullWidth style={styles.btn} />
      </Card>
      {isAdmin && (
        <Card style={styles.card} variant="elevated" accentColor={colors.primary}>
          <Text style={styles.cardTitle}>Admin</Text>
          <Text style={styles.cardDesc}>Review applications, clinics, and reports.</Text>
          <Button title="Open admin" onPress={selectAdmin} fullWidth style={styles.btn} />
        </Card>
      )}
      <TouchableOpacity onPress={logout} style={styles.signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  hero: { marginBottom: layout.sectionGap },
  heroTitle: { ...typography.h2, marginBottom: spacing.xs },
  heroSubtitle: { ...typography.body, color: colors.textSecondary },
  card: { marginBottom: spacing.md },
  cardTitle: { ...typography.h3, marginBottom: spacing.xs },
  cardDesc: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  btn: { alignSelf: 'stretch' },
  signOut: { marginTop: spacing.xl, paddingVertical: spacing.md, alignItems: 'center' },
  signOutText: { ...typography.body, color: colors.textTertiary },
});
