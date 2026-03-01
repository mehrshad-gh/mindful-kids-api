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
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { submitClinicApplication } from '../../api/clinicApplications';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { layout } from '../../theme';
import { borderRadius } from '../../theme/spacing';

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
  if (axios.isAxiosError(err) && err.response?.status === 429)
    return 'Too many submissions. Please try again later.';
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
    <ScreenLayout centered>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Apply as a clinic</Text>
          <Text style={styles.heroSubtitle}>
            List your clinic on Mindful Kids. We'll review your application and contact you.
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SectionHeader title="Clinic details" />
          <Card style={styles.card}>
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
              placeholder="e.g. United States, UK"
            />
            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of your clinic (optional)"
              multiline
              numberOfLines={3}
            />
          </Card>

          <SectionHeader title="Contact" />
          <Card style={styles.card}>
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
          </Card>

          <SectionHeader
            title="Document *"
            subtitle="PDF or image (JPEG, PNG, WebP), max 10 MB"
          />
          <Card style={styles.card}>
            <TouchableOpacity
              style={styles.docButton}
              onPress={handlePickDocument}
              disabled={picking}
            >
              {picking ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Text style={styles.docButtonIcon}>📄</Text>
                  <Text style={styles.docButtonText}>
                    {document ? document.name : 'Choose file'}
                  </Text>
                  <Text style={styles.docButtonHint}>
                    {document ? 'Tap to change' : 'Required to submit'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Card>

          <Button
            title="Submit application"
            onPress={handleSubmit}
            loading={submitting}
            disabled={!document}
            fullWidth
            size="large"
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { marginBottom: layout.sectionGap },
  heroTitle: { ...typography.h2, marginBottom: spacing.sm },
  heroSubtitle: { ...typography.body, color: colors.textSecondary },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  card: { marginBottom: layout.sectionGap },
  docButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  docButtonIcon: { fontSize: 32, marginBottom: spacing.sm },
  docButtonText: { ...typography.body, fontWeight: '600', color: colors.text },
  docButtonHint: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.xs },
  submitBtn: { marginTop: spacing.md },
});
