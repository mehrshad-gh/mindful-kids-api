import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { submitClinicApplication } from '../../api/clinicApplications';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const d = err.response.data as { error?: string };
    if (d.error) return d.error;
  }
  if (axios.isAxiosError(err) && err.response?.status === 429) {
    return 'Too many submissions. Please try again later.';
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}

export function ClinicApplicationFormScreen() {
  const [clinicName, setClinicName] = useState('');
  const [country, setCountry] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [document, setDocument] = useState<{
    uri: string;
    name: string;
    mimeType?: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [picking, setPicking] = useState(false);

  const handlePickDocument = async () => {
    setPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_DOCUMENT_TYPES,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      setDocument({
        uri: file.uri,
        name: file.name ?? 'document',
        mimeType: file.mimeType ?? undefined,
      });
    } catch {
      Alert.alert('Error', 'Could not select file.');
    } finally {
      setPicking(false);
    }
  };

  const handleSubmit = async () => {
    const name = clinicName.trim();
    const c = country.trim();
    const email = contactEmail.trim();
    if (!name || !c || !email) {
      Alert.alert('Missing fields', 'Clinic name, country, and contact email are required.');
      return;
    }
    if (!document) {
      Alert.alert('Document required', 'Please attach a PDF or image (JPEG, PNG, WebP).');
      return;
    }
    setSubmitting(true);
    try {
      await submitClinicApplication(
        {
          clinic_name: name,
          country: c,
          contact_email: email,
          contact_phone: contactPhone.trim() || undefined,
          description: description.trim() || undefined,
        },
        document
      );
      Alert.alert(
        'Application submitted',
        'Thank you. We will review your clinic application and get back to you at the email you provided.',
        [{ text: 'OK' }]
      );
      setClinicName('');
      setCountry('');
      setContactEmail('');
      setContactPhone('');
      setDescription('');
      setDocument(null);
    } catch (err) {
      Alert.alert('Submission failed', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.intro}>
            Apply to list your clinic on Mindful Kids. We'll review your application and contact you.
          </Text>
          <Input
            label="Clinic name *"
            value={clinicName}
            onChangeText={setClinicName}
            placeholder="e.g. Family Wellness Center"
          />
          <Input
            label="Country *"
            value={country}
            onChangeText={setCountry}
            placeholder="e.g. US, UK"
          />
          <Input
            label="Contact email *"
            value={contactEmail}
            onChangeText={setContactEmail}
            placeholder="admin@clinic.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Contact phone"
            value={contactPhone}
            onChangeText={setContactPhone}
            placeholder="Optional"
            keyboardType="phone-pad"
          />
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description of your clinic (optional)"
            multiline
            numberOfLines={3}
          />
          <View style={styles.docRow}>
            <Text style={styles.label}>Document * (PDF or image, max 10 MB)</Text>
            <TouchableOpacity
              style={styles.pickBtn}
              onPress={handlePickDocument}
              disabled={picking}
            >
              {picking ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.pickBtnText}>
                  {document ? document.name : 'Choose file'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          <Button
            title="Submit application"
            onPress={handleSubmit}
            loading={submitting}
            disabled={!document}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xl },
  intro: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  docRow: { marginBottom: spacing.md },
  pickBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  pickBtnText: { ...typography.body, color: colors.primary },
  submitBtn: { marginTop: spacing.md },
});
