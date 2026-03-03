import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { listMyClinics, type ClinicAdminClinic } from '../../api/clinicAdmin';
import type { ClinicStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { layout } from '../../theme';

type Nav = NativeStackNavigationProp<ClinicStackParamList, 'ClinicAvailabilityClinics'>;

export function ClinicAvailabilityClinicsScreen() {
  const navigation = useNavigation<Nav>();
  const [clinics, setClinics] = useState<ClinicAdminClinic[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { clinics: list } = await listMyClinics();
      setClinics(list);
    } catch {
      setClinics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  if (loading && clinics.length === 0) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout scroll>
      <Text style={styles.title}>Manage therapist availability</Text>
      <Text style={styles.subtitle}>Select a clinic to see its therapists and manage their slots.</Text>
      {clinics.length === 0 ? (
        <Card style={styles.card}>
          <Text style={styles.emptyText}>No clinic linked. Contact support if you expect access.</Text>
        </Card>
      ) : (
        clinics.map((clinic) => (
          <TouchableOpacity
            key={clinic.id}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ClinicTherapists', { clinicId: clinic.id })}
          >
            <Card style={styles.card} variant="outlined">
              <Text style={styles.clinicName}>{clinic.name}</Text>
              <Text style={styles.tapHint}>Tap to view therapists and manage availability</Text>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  card: { marginBottom: layout.listItemGap },
  clinicName: { ...typography.h3, marginBottom: spacing.xs },
  tapHint: { ...typography.subtitle, color: colors.textTertiary },
  emptyText: { ...typography.body, color: colors.textSecondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
