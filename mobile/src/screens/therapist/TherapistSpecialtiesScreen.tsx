import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { getApplication, upsertApplication } from '../../api/therapist';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { TherapistOnboardingStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<TherapistOnboardingStackParamList, 'TherapistSpecialties'>;

const COMMON_SPECIALTIES = [
  'Child Psychology',
  'Family Therapy',
  'Anxiety',
  'Depression',
  'Trauma',
  'ADHD',
  'CBT',
  'DBT',
  'Play Therapy',
  'Parenting Support',
];

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const d = err.response.data as { error?: string };
    if (d.error) return d.error;
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}

export function TherapistSpecialtiesScreen({ navigation }: { navigation: Nav }) {
  const [specialty, setSpecialty] = useState('');
  const [specialization, setSpecialization] = useState<string[]>([]);
  const [customSpec, setCustomSpec] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getApplication();
        if (cancelled) return;
        if (res.application) {
          setSpecialty(res.application.specialty || '');
          setSpecialization(res.application.specialization || []);
        }
      } catch {
        // keep default
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleSpec = (s: string) => {
    setSpecialization((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const addCustom = () => {
    const t = customSpec.trim();
    if (t && !specialization.includes(t)) {
      setSpecialization((prev) => [...prev, t]);
      setCustomSpec('');
    }
  };

  const handleNext = async () => {
    if (!specialty.trim()) {
      Alert.alert('Required', 'Please enter your primary specialty.');
      return;
    }
    setLoading(true);
    try {
      await upsertApplication({
        specialty: specialty.trim(),
        specialization: specialization.length ? specialization : undefined,
      });
      navigation.navigate('TherapistClinic');
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return null;

  return (
    <ScreenLayout>
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Input
          label="Primary specialty"
          value={specialty}
          onChangeText={setSpecialty}
          placeholder="e.g. Child Psychology"
        />
        <Text style={styles.label}>Areas of focus (select all that apply)</Text>
        <View style={styles.chips}>
          {COMMON_SPECIALTIES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, specialization.includes(s) && styles.chipSelected]}
              onPress={() => toggleSpec(s)}
            >
              <Text style={[styles.chipText, specialization.includes(s) && styles.chipTextSelected]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.customRow}>
          <Input
            value={customSpec}
            onChangeText={setCustomSpec}
            placeholder="Add another"
            style={styles.customInput}
          />
          <Button title="Add" onPress={addCustom} size="small" style={styles.addBtn} />
        </View>
        {specialization.length > 0 && (
          <Text style={styles.selected}>Selected: {specialization.join(', ')}</Text>
        )}
        <Button title="Continue" onPress={handleNext} loading={loading} style={styles.button} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, color: colors.text },
  chipTextSelected: { color: colors.surface },
  customRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  customInput: { flex: 1, marginBottom: 0 },
  addBtn: { marginTop: 0 },
  selected: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  button: { marginTop: spacing.sm },
});
