import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { getApplication, upsertApplication } from '../../api/therapist';
import type { TherapistCredential } from '../../types/therapist';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { TherapistOnboardingStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<TherapistOnboardingStackParamList, 'TherapistCredentials'>;

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const d = err.response.data as { error?: string };
    if (d.error) return d.error;
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}

const DEFAULT_CREDENTIAL: TherapistCredential = { type: 'license', issuer: '', number: '' };

export function TherapistCredentialsScreen({ navigation }: { navigation: Nav }) {
  const [credentials, setCredentials] = useState<TherapistCredential[]>([{ ...DEFAULT_CREDENTIAL }]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getApplication();
        if (cancelled) return;
        if (res.application?.credentials?.length) {
          setCredentials(
            res.application.credentials.map((c) => ({
              type: c.type || 'license',
              issuer: c.issuer || '',
              number: c.number || '',
              document_url: c.document_url,
            }))
          );
        }
      } catch {
        // keep default
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const updateCred = (index: number, field: keyof TherapistCredential, value: string) => {
    setCredentials((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addCredential = () => {
    setCredentials((prev) => [...prev, { ...DEFAULT_CREDENTIAL }]);
  };

  const removeCredential = (index: number) => {
    if (credentials.length <= 1) return;
    setCredentials((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    const valid = credentials.every((c) => c.type.trim());
    if (!valid) {
      Alert.alert('Required', 'Please enter at least credential type for each entry.');
      return;
    }
    setLoading(true);
    try {
      await upsertApplication({ credentials });
      navigation.navigate('TherapistLicense');
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
        <Text style={styles.subtitle}>Add your credentials (license, certifications). You can add a document link in the next step.</Text>
        {credentials.map((c, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Credential {i + 1}</Text>
              {credentials.length > 1 && (
                <TouchableOpacity onPress={() => removeCredential(i)}>
                  <Text style={styles.remove}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            <Input
              label="Type"
              value={c.type}
              onChangeText={(v) => updateCred(i, 'type', v)}
              placeholder="e.g. license, certification"
            />
            <Input
              label="Issuer"
              value={c.issuer || ''}
              onChangeText={(v) => updateCred(i, 'issuer', v)}
              placeholder="e.g. State Board"
            />
            <Input
              label="Number"
              value={c.number || ''}
              onChangeText={(v) => updateCred(i, 'number', v)}
              placeholder="License or certificate number"
            />
          </View>
        ))}
        <Button title="+ Add another credential" onPress={addCredential} variant="outline" style={styles.addBtn} />
        <Button title="Continue" onPress={handleNext} loading={loading} style={styles.button} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  card: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: 12, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  cardTitle: { ...typography.label, color: colors.text },
  remove: { fontSize: 14, color: colors.error },
  addBtn: { marginBottom: spacing.md },
  button: { marginTop: spacing.sm },
});
