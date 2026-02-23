import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { getApplication, upsertApplication } from '../../api/therapist';
import { listClinics } from '../../api/clinics';
import type { Clinic, ClinicAffiliation } from '../../types/therapist';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { TherapistOnboardingStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<TherapistOnboardingStackParamList, 'TherapistClinic'>;

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const d = err.response.data as { error?: string };
    if (d.error) return d.error;
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}

export function TherapistClinicScreen({ navigation }: { navigation: Nav }) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selected, setSelected] = useState<ClinicAffiliation[]>([]);
  const [roleLabel, setRoleLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingClinics, setLoadingClinics] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listClinics({ limit: 100 });
        if (cancelled) return;
        setClinics(res.clinics);
      } catch {
        setClinics([]);
      } finally {
        if (!cancelled) setLoadingClinics(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getApplication();
        if (cancelled) return;
        if (res.clinic_affiliations?.length) {
          setSelected(
            res.clinic_affiliations.map((a) => ({
              clinic_id: a.clinic_id,
              role_label: a.role_label,
              is_primary: a.is_primary,
            }))
          );
        }
      } catch {
        // keep default
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleClinic = (clinicId: string, isPrimary?: boolean) => {
    setSelected((prev) => {
      const exists = prev.find((a) => a.clinic_id === clinicId);
      if (exists) return prev.filter((a) => a.clinic_id !== clinicId);
      return [...prev, { clinic_id: clinicId, role_label: roleLabel || undefined, is_primary: !!isPrimary }];
    });
  };

  const setPrimary = (clinicId: string) => {
    setSelected((prev) =>
      prev.map((a) => ({
        ...a,
        is_primary: a.clinic_id === clinicId,
      }))
    );
  };

  const isSelected = (clinicId: string) => selected.some((a) => a.clinic_id === clinicId);
  const isPrimary = (clinicId: string) => selected.find((a) => a.clinic_id === clinicId)?.is_primary;

  const handleNext = async () => {
    setLoading(true);
    try {
      const affiliations = selected.map((a) => ({
        ...a,
        role_label: roleLabel.trim() || undefined,
      }));
      await upsertApplication({ clinic_affiliations: affiliations });
      navigation.navigate('TherapistSubmit');
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (loadingClinics) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading clinics…</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>Select the clinic(s) you’re affiliated with. You can add a role (e.g. Staff, Associate) and mark one as primary.</Text>
        <Input
          label="Your role at clinic (optional)"
          value={roleLabel}
          onChangeText={setRoleLabel}
          placeholder="e.g. Staff Psychologist"
        />
        {clinics.length === 0 ? (
          <Text style={styles.empty}>No clinics in the directory yet. You can still continue and submit; an admin can add clinics later.</Text>
        ) : (
          clinics.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.clinicCard, isSelected(c.id) && styles.clinicCardSelected]}
              onPress={() => toggleClinic(c.id)}
              activeOpacity={0.7}
            >
              <View style={styles.clinicRow}>
                <Text style={styles.clinicName}>{c.name}</Text>
                {isSelected(c.id) && <Text style={styles.check}>✓</Text>}
              </View>
              {c.description ? <Text style={styles.clinicDesc} numberOfLines={2}>{c.description}</Text> : null}
              {isSelected(c.id) && (
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setPrimary(c.id)}>
                  <Text style={styles.primaryBtnText}>{isPrimary(c.id) ? '★ Primary' : 'Set as primary'}</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
        <Button title="Continue" onPress={handleNext} loading={loading} style={styles.button} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  loadingText: { marginTop: spacing.md, color: colors.textSecondary },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  empty: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.lg },
  clinicCard: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  clinicCardSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  clinicRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clinicName: { ...typography.h3, marginBottom: spacing.xs },
  clinicDesc: { ...typography.bodySmall, color: colors.textSecondary },
  check: { fontSize: 18, color: colors.primary, fontWeight: '700' },
  primaryBtn: { marginTop: spacing.sm },
  primaryBtnText: { fontSize: 14, color: colors.primary },
  button: { marginTop: spacing.lg },
});
