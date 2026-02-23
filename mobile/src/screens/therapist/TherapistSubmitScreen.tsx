import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { Button } from '../../components/ui/Button';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { getApplication, submitApplication } from '../../api/therapist';
import { listClinics } from '../../api/clinics';
import type { TherapistApplication } from '../../types/therapist';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { TherapistOnboardingStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<TherapistOnboardingStackParamList, 'TherapistSubmit'>;

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const d = err.response.data as { error?: string };
    if (d.error) return d.error;
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}

interface ClinicAffiliationRow {
  clinic_id: string;
  role_label?: string;
  is_primary?: boolean;
}

export function TherapistSubmitScreen({ navigation }: { navigation: Nav }) {
  const [application, setApplication] = useState<TherapistApplication | null>(null);
  const [clinicAffiliations, setClinicAffiliations] = useState<ClinicAffiliationRow[]>([]);
  const [clinicNames, setClinicNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [appRes, clinicsRes] = await Promise.all([getApplication(), listClinics({ limit: 200 })]);
        if (cancelled) return;
        setApplication(appRes.application || null);
        setClinicAffiliations(appRes.clinic_affiliations || []);
        const names: Record<string, string> = {};
        clinicsRes.clinics.forEach((c) => { names[c.id] = c.name; });
        setClinicNames(names);
      } catch {
        setApplication(null);
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitApplication();
      navigation.replace('TherapistSuccess');
    } catch (err) {
      Alert.alert('Submit failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenLayout>
    );
  }

  if (!application) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <Text style={styles.body}>No application found. Please complete the previous steps.</Text>
          <Button title="Go back" onPress={() => navigation.goBack()} style={styles.button} />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Review and submit</Text>
        <Text style={styles.subtitle}>Please confirm your information before submitting for review.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional</Text>
          <Text style={styles.body}>{application.professional_name}</Text>
          <Text style={styles.body}>{application.email}</Text>
          {application.phone ? <Text style={styles.body}>{application.phone}</Text> : null}
          {application.bio ? <Text style={styles.bodySmall}>{application.bio}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credentials</Text>
          {application.credentials?.length
            ? application.credentials.map((c, i) => (
                <Text key={i} style={styles.bodySmall}>
                  {c.type}{c.issuer ? ` · ${c.issuer}` : ''}{c.number ? ` #${c.number}` : ''}
                </Text>
              ))
            : <Text style={styles.bodySmall}>None added</Text>}
        </View>

        {application.specialty && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialty</Text>
            <Text style={styles.body}>{application.specialty}</Text>
            {application.specialization?.length ? (
              <Text style={styles.bodySmall}>{application.specialization.join(', ')}</Text>
            ) : null}
          </View>
        )}

        {clinicAffiliations.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Clinic affiliation</Text>
            {clinicAffiliations.map((a, i) => (
              <Text key={i} style={styles.bodySmall}>
                {clinicNames[a.clinic_id] || a.clinic_id}{a.role_label ? ` · ${a.role_label}` : ''}{a.is_primary ? ' (Primary)' : ''}
              </Text>
            ))}
          </View>
        ) : null}

        <Text style={styles.note}>After you submit, our team will review your application. You’ll be notified when it’s approved.</Text>
        <Button title="Submit for review" onPress={handleSubmit} loading={loading} style={styles.button} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.label, color: colors.primary, marginBottom: spacing.xs },
  body: { ...typography.body, marginBottom: spacing.xs },
  bodySmall: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs },
  note: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.lg },
  button: { marginTop: spacing.sm },
});
