import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getRequiredAcceptances } from '../../api/legalGate';
import { recordLegalAcceptance } from '../../services/authService';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const DOCUMENT_LABELS: Record<string, string> = {
  terms: 'Terms of Service',
  privacy_policy: 'Privacy Policy',
  professional_disclaimer: 'Professional Disclaimer',
  provider_terms: 'Provider Terms',
};

export function LegalReacceptGateScreen({ navigation }: { navigation: any }) {
  const { legalGateMissing, setLegalGateMissing } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const missing = legalGateMissing ?? [];

  const openDoc = (screen: string) => {
    navigation.navigate(screen);
  };

  const handleAcceptAndContinue = async () => {
    if (!agreed) {
      Alert.alert('Required', 'Please confirm you have read and agree to the documents.');
      return;
    }
    if (missing.length === 0) return;
    setSubmitting(true);
    try {
      for (const { document_type, document_version } of missing) {
        await recordLegalAcceptance(
          document_type as 'terms' | 'privacy_policy' | 'professional_disclaimer' | 'provider_terms',
          document_version
        );
      }
      const { missing: stillMissing } = await getRequiredAcceptances();
      if (stillMissing.length === 0) {
        setLegalGateMissing(null);
      } else {
        setLegalGateMissing(stillMissing);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not record acceptances. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review and accept updated terms</Text>
      <Text style={styles.subtitle}>
        Please read and accept the following to continue using the app.
      </Text>

      <View style={styles.list}>
        {missing.map(({ document_type }) => (
          <TouchableOpacity
            key={document_type}
            style={styles.docRow}
            onPress={() => {
              if (document_type === 'terms') openDoc('TermsOfService');
              else if (document_type === 'privacy_policy') openDoc('PrivacyPolicy');
              else if (document_type === 'professional_disclaimer') openDoc('ProfessionalDisclaimer');
              else if (document_type === 'provider_terms') openDoc('ProviderTerms');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.docLabel}>{DOCUMENT_LABELS[document_type] ?? document_type}</Text>
            <Text style={styles.docLink}>View</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.checkRow}
        onPress={() => setAgreed(!agreed)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
          {agreed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkLabel}>I have read and agree</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleAcceptAndContinue}
        disabled={submitting}
        activeOpacity={0.8}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Accept and continue</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  list: {
    marginBottom: spacing.xl,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  docLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  docLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  checkLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.body,
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },
});
