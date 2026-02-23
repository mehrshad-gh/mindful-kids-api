import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, ScrollView, View, Text } from 'react-native';
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

type Nav = NativeStackNavigationProp<TherapistOnboardingStackParamList, 'TherapistLicense'>;

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const d = err.response.data as { error?: string };
    if (d.error) return d.error;
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}

export function TherapistLicenseScreen({ navigation }: { navigation: Nav }) {
  const [documentUrls, setDocumentUrls] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [credentialCount, setCredentialCount] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getApplication();
        if (cancelled) return;
        const creds = res.application?.credentials ?? [];
        setCredentialCount(Math.max(1, creds.length));
        const map: Record<number, string> = {};
        creds.forEach((c, i) => {
          if (c.document_url) map[i] = c.document_url;
        });
        setDocumentUrls(map);
      } catch {
        // keep default
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleNext = async () => {
    setLoading(true);
    try {
      const res = await getApplication();
      const creds = res.application?.credentials ?? [{ type: 'license', issuer: '', number: '' }];
      const updated = creds.map((c, i) => ({
        ...c,
        document_url: documentUrls[i]?.trim() || undefined,
      }));
      await upsertApplication({ credentials: updated });
      navigation.navigate('TherapistSpecialties');
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
        <Text style={styles.subtitle}>
          Add a link to your license or credential document (e.g. a secure PDF or verification page). This helps us verify your credentials.
        </Text>
        {Array.from({ length: credentialCount }).map((_, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.label}>Document link for credential {i + 1}</Text>
            <Input
              value={documentUrls[i] ?? ''}
              onChangeText={(v) => setDocumentUrls((prev) => ({ ...prev, [i]: v }))}
              placeholder="https://..."
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        ))}
        <Button title="Continue" onPress={handleNext} loading={loading} style={styles.button} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  card: { marginBottom: spacing.md },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.xs },
  button: { marginTop: spacing.lg },
});
