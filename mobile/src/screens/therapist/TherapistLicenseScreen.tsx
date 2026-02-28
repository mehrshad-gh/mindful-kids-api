import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { getApplication, upsertApplication, uploadCredentialDocument } from '../../api/therapist';
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

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export function TherapistLicenseScreen({ navigation }: { navigation: Nav }) {
  const [documentUrls, setDocumentUrls] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
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

  const handleUploadDocument = async (index: number) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_DOCUMENT_TYPES,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      setUploadingIndex(index);
      const { url } = await uploadCredentialDocument({
        uri: file.uri,
        name: file.name ?? 'document',
        mimeType: file.mimeType ?? undefined,
      });
      setDocumentUrls((prev) => ({ ...prev, [index]: url }));
    } catch (err) {
      Alert.alert('Upload failed', getErrorMessage(err));
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleNext = async () => {
    setLoading(true);
    try {
      const res = await getApplication();
      const app = res.application;
      if (!app) {
        Alert.alert('Error', 'Please complete the previous steps (professional name and credentials) first.');
        setLoading(false);
        return;
      }
      const creds = app.credentials ?? [{ type: 'license', issuer: '', number: '' }];
      const updated = creds.map((c, i) => ({
        ...c,
        document_url: documentUrls[i]?.trim() || undefined,
      }));
      await upsertApplication({
        professional_name: app.professional_name,
        email: app.email,
        credentials: updated,
      });
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
          For each credential, either upload a document (PDF or image) or provide a link to your license or verification page.
        </Text>
        {Array.from({ length: credentialCount }).map((_, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.label}>Document for credential {i + 1}</Text>
            <Input
              value={documentUrls[i] ?? ''}
              onChangeText={(v) => setDocumentUrls((prev) => ({ ...prev, [i]: v }))}
              placeholder="Paste a link (e.g. https://...) or upload below"
              keyboardType="url"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.uploadBtn, uploadingIndex === i && styles.uploadBtnDisabled]}
              onPress={() => handleUploadDocument(i)}
              disabled={uploadingIndex !== null}
            >
              {uploadingIndex === i ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.uploadBtnText}>Upload document (PDF or image)</Text>
              )}
            </TouchableOpacity>
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
  uploadBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  uploadBtnDisabled: { opacity: 0.7 },
  uploadBtnText: { ...typography.bodySmall, color: colors.primary },
  button: { marginTop: spacing.lg },
});
