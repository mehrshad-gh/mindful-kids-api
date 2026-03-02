import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Alert, TouchableOpacity } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import {
  getApplication,
  getProfileMe,
  getVerificationStatus,
  getCredentials,
  getReports,
  getClinicAffiliations,
  postCredentials,
  uploadCredentialDocument,
} from '../../api/therapist';
import type {
  TherapistProfile,
  TherapistMeCredential,
  TherapistMeReport,
  TherapistMeClinicAffiliation,
} from '../../api/therapist';
import type { ApplicationStatus } from '../../types/therapist';
import type { TherapistStackParamList } from '../../types/navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const STATUS_MESSAGES: Record<ApplicationStatus, string> = {
  draft: 'Your application is saved as a draft. You can continue and submit when ready.',
  pending: 'Your application is under review. We’ll notify you when your profile is approved.',
  approved: 'Your profile is verified and visible in the directory.',
  rejected: 'Your application was not approved. You can sign in and reapply with updated information.',
};

const SUSPENDED_MESSAGE =
  'Your public profile is currently suspended following a review. It is not visible in the directory. Contact support if you have questions.';
const REVOKED_MESSAGE =
  'Your verification has been revoked. Your profile is not shown as verified in the directory. Contact support if you have questions.';

type Nav = NativeStackNavigationProp<TherapistStackParamList, 'TherapistDashboard'>;

export function TherapistDashboardScreen() {
  const { user, setAppRole, logout } = useAuth();
  const navigation = useNavigation<Nav>();
  const [status, setStatus] = useState<ApplicationStatus | null>(null);
  const [psychologistVerificationStatus, setPsychologistVerificationStatus] = useState<string | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [verificationExpiresAt, setVerificationExpiresAt] = useState<string | null>(null);
  const [lastReviewedAt, setLastReviewedAt] = useState<string | null>(null);
  const [profile, setProfile] = useState<TherapistProfile | null>(null);
  const [credentials, setCredentials] = useState<TherapistMeCredential[]>([]);
  const [reports, setReports] = useState<TherapistMeReport[]>([]);
  const [affiliations, setAffiliations] = useState<TherapistMeClinicAffiliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credentialActionLoading, setCredentialActionLoading] = useState<string | null>(null);
  const [addingCredential, setAddingCredential] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const [appRes, profileRes, verificationRes, credentialsRes, reportsRes, affiliationsRes] =
            await Promise.all([
              getApplication(),
              getProfileMe(),
              getVerificationStatus(),
              getCredentials().catch(() => ({ credentials: [] })),
              getReports().catch(() => ({ reports: [] })),
              getClinicAffiliations().catch(() => ({ affiliations: [] })),
            ]);
          if (!cancelled) {
            if (appRes.application) {
              setStatus(appRes.application.status);
              setPsychologistVerificationStatus(appRes.application.psychologist_verification_status ?? null);
            } else {
              setStatus(null);
              setPsychologistVerificationStatus(null);
            }
            setProfile(profileRes.profile ?? null);
            if (verificationRes.verification_status != null)
              setPsychologistVerificationStatus((prev) => prev ?? verificationRes.verification_status);
            setVerifiedAt(verificationRes.verified_at ?? null);
            setVerificationExpiresAt(verificationRes.verification_expires_at ?? null);
            setLastReviewedAt(verificationRes.last_reviewed_at ?? null);
            setCredentials(credentialsRes.credentials ?? []);
            setReports(reportsRes.reports ?? []);
            setAffiliations(affiliationsRes.affiliations ?? []);
          }
        } catch (e) {
          if (!cancelled) setError('Could not load dashboard.');
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const useAsParent = () => setAppRole('parent');

  const openApplication = () => {
    (navigation.getParent() as any)?.navigate('TherapistOnboarding', {
      screen: status === 'draft' ? 'TherapistSubmit' : 'TherapistProfessional',
    });
  };

  const canStartOrContinue =
    !status || status === 'draft' || status === 'rejected';

  const requestCredentialRenewal = async (credentialId: string) => {
    setCredentialActionLoading(credentialId);
    try {
      await postCredentials({ credential_id: credentialId, renewal_requested: true });
      const res = await getCredentials();
      setCredentials(res.credentials);
    } catch {
      setError('Could not request renewal.');
    } finally {
      setCredentialActionLoading(null);
    }
  };

  const ALLOWED_CREDENTIAL_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ] as const;

  const addCredential = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_CREDENTIAL_TYPES,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      setAddingCredential(true);
      const { url } = await uploadCredentialDocument({
        uri: file.uri,
        name: file.name ?? 'document',
        mimeType: file.mimeType ?? undefined,
      });
      await postCredentials({ document_url: url, credential_type: 'license' });
      const res = await getCredentials();
      setCredentials(res.credentials);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Upload or submit failed.';
      Alert.alert('Add credential', message);
    } finally {
      setAddingCredential(false);
    }
  };

  return (
    <ScreenLayout scroll>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <Text style={styles.greeting}>Hello, {user?.name ?? 'Therapist'}</Text>
        {profile && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Profile preview</Text>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
              </View>
              <View style={styles.profileMeta}>
                <Text style={styles.profileName}>{profile.name}</Text>
                {profile.specialty ? (
                  <Text style={styles.profileSpecialty}>{profile.specialty}</Text>
                ) : null}
                {profile.location ? (
                  <Text style={styles.profileLocation}>{profile.location}</Text>
                ) : null}
              </View>
            </View>
            <Button
              title="Edit profile"
              variant="outline"
              size="small"
              onPress={openApplication}
              style={styles.editProfileBtn}
            />
          </Card>
        )}

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Verification status</Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : status ? (
            <>
              {status === 'approved' &&
              (psychologistVerificationStatus === 'suspended' || psychologistVerificationStatus === 'rejected') ? (
                <>
                  <StatusBadge
                    label={psychologistVerificationStatus === 'rejected' ? 'Revoked' : 'Suspended'}
                    variant={psychologistVerificationStatus === 'rejected' ? 'rejected' : 'suspended'}
                  />
                  <Text style={styles.message}>
                    {psychologistVerificationStatus === 'rejected' ? REVOKED_MESSAGE : SUSPENDED_MESSAGE}
                  </Text>
                </>
              ) : (
                <>
                  <StatusBadge
                    label={status.charAt(0).toUpperCase() + status.slice(1)}
                    variant={
                      status === 'draft'
                        ? 'draft'
                        : status === 'pending'
                          ? 'pending'
                          : status === 'approved'
                            ? 'approved'
                            : 'rejected'
                    }
                  />
                  <Text style={styles.message}>{STATUS_MESSAGES[status]}</Text>
                </>
              )}
              {verificationExpiresAt && status === 'approved' && psychologistVerificationStatus === 'verified' && (
                <View style={styles.expiryRow}>
                  <Text style={styles.expiryLabel}>Verification expires</Text>
                  <Text style={styles.expiryValue}>
                    {new Date(verificationExpiresAt).toLocaleDateString(undefined, {
                      dateStyle: 'medium',
                    })}
                  </Text>
                </View>
              )}
              {verifiedAt && (status === 'approved' || psychologistVerificationStatus === 'verified') && (
                <Text style={styles.metaText}>
                  Verified {new Date(verifiedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  {lastReviewedAt
                    ? ` · Last reviewed ${new Date(lastReviewedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}`
                    : ''}
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.message}>You don’t have an application yet. Complete therapist onboarding to apply.</Text>
          )}
        </Card>

        {profile && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Credentials</Text>
            {credentials.length === 0 ? (
              <Text style={styles.message}>No credentials on file. Add one from your application or after approval.</Text>
            ) : null}
            {credentials.length > 0 ? (
              credentials.map((c) => (
                <View key={c.id} style={styles.credentialItem}>
                  <View style={styles.credentialRow}>
                    <View style={styles.credentialMeta}>
                      <Text style={styles.credentialType}>{c.credential_type}</Text>
                      {c.issuer ? (
                        <Text style={styles.credentialIssuer}>{c.issuer}</Text>
                      ) : null}
                      {c.expires_at ? (
                        <Text style={styles.metaText}>Expires {new Date(c.expires_at).toLocaleDateString()}</Text>
                      ) : null}
                      {c.renewal_requested_at ? (
                        <Text style={styles.metaText}>Renewal requested</Text>
                      ) : null}
                    </View>
                    <StatusBadge
                      label={
                        c.verification_status === 'pending_review'
                          ? 'Pending review'
                          : c.verification_status.charAt(0).toUpperCase() + c.verification_status.slice(1)
                      }
                      variant={
                        c.verification_status === 'pending_review'
                          ? 'pending'
                          : c.verification_status === 'verified'
                            ? 'approved'
                            : c.verification_status === 'rejected'
                              ? 'rejected'
                              : c.verification_status === 'expired'
                                ? 'suspended'
                                : 'neutral'
                      }
                    />
                  </View>
                  {!c.renewal_requested_at &&
                    (c.verification_status === 'verified' || c.verification_status === 'expired') && (
                    <Button
                      title={credentialActionLoading === c.id ? 'Requesting…' : 'Request re-verification'}
                      variant="outline"
                      size="small"
                      onPress={() => requestCredentialRenewal(c.id)}
                      disabled={!!credentialActionLoading}
                      style={styles.credentialActionBtn}
                    />
                  )}
                </View>
              ))
            ) : null}
            <Button
              title={addingCredential ? 'Uploading…' : 'Add credential'}
              variant="outline"
              size="small"
              onPress={addCredential}
              disabled={addingCredential}
              style={styles.addCredentialBtn}
            />
          </Card>
        )}

        {reports.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Reports about your profile</Text>
            <Text style={styles.message}>You can view reports for transparency. Resolution is handled by the team.</Text>
            {reports.map((r) => (
              <View key={r.id} style={styles.reportRow}>
                <Text style={styles.reportReason}>{r.reason}</Text>
                <View style={styles.reportMeta}>
                  <StatusBadge label={r.status} variant="neutral" style={styles.reportBadge} />
                  <Text style={styles.metaText}>{new Date(r.created_at).toLocaleDateString()}</Text>
                </View>
              </View>
            ))}
          </Card>
        )}

        {(affiliations.length > 0 || (profile?.clinics && profile.clinics.length > 0)) && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Clinic affiliations</Text>
            {affiliations.length > 0
              ? affiliations.map((a) => (
                  <View key={a.clinic_id} style={styles.clinicRow}>
                    <View style={styles.clinicMeta}>
                      <Text style={styles.clinicName}>{a.clinic_name}</Text>
                      {a.role ? (
                        <Text style={styles.clinicRole}>{a.role}</Text>
                      ) : null}
                    </View>
                    <StatusBadge
                      label={a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                      variant={
                        a.status === 'active' ? 'approved' : a.status === 'pending' ? 'pending' : 'neutral'
                      }
                    />
                  </View>
                ))
              : profile?.clinics?.map((c) => (
                  <View key={c.id} style={styles.clinicRow}>
                    <Text style={styles.clinicName}>{c.name}</Text>
                    {c.role_label ? (
                      <Text style={styles.clinicRole}>{c.role_label}</Text>
                    ) : null}
                  </View>
                ))}
          </Card>
        )}

        {canStartOrContinue && (
          <Button
            title={!status ? 'Start application' : status === 'draft' ? 'Continue application' : 'Reapply'}
            onPress={openApplication}
            style={styles.btn}
          />
        )}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Legal</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')} style={styles.legalLink}>
            <Text style={styles.legalLinkText}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} style={styles.legalLink}>
            <Text style={styles.legalLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ProfessionalDisclaimer')} style={styles.legalLink}>
            <Text style={styles.legalLinkText}>Professional Disclaimer</Text>
          </TouchableOpacity>
        </Card>

        <Button title="Use app as Parent" onPress={useAsParent} style={styles.btn} />
        <Button title="Sign out" onPress={logout} variant="ghost" style={styles.signOutBtn} />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  greeting: { ...typography.h2, color: colors.text, marginBottom: spacing.lg },
  card: { marginBottom: spacing.lg },
  cardTitle: { ...typography.body, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: { ...typography.h3, color: colors.primary },
  profileMeta: { flex: 1 },
  profileName: { ...typography.h4, color: colors.text, marginBottom: spacing.xs },
  profileSpecialty: { ...typography.subtitle, color: colors.textSecondary, marginBottom: spacing.xs },
  profileLocation: { ...typography.bodySmall, color: colors.textTertiary },
  editProfileBtn: { alignSelf: 'flex-start', marginTop: spacing.xs },
  loader: { marginVertical: spacing.sm },
  error: { ...typography.body, color: colors.error },
  message: { ...typography.body, color: colors.textSecondary },
  expiryRow: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  expiryLabel: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs },
  expiryValue: { ...typography.body, fontWeight: '600', color: colors.text },
  metaText: { ...typography.bodySmall, color: colors.textTertiary, marginTop: spacing.xs },
  credentialItem: { marginBottom: spacing.sm },
  credentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  credentialMeta: { flex: 1, marginRight: spacing.sm },
  credentialType: { ...typography.body, fontWeight: '600', color: colors.text },
  credentialIssuer: { ...typography.bodySmall, color: colors.textSecondary },
  credentialActionBtn: { marginTop: spacing.xs },
  addCredentialBtn: { marginTop: spacing.sm },
  reportRow: { marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  reportReason: { ...typography.body, color: colors.text },
  reportMeta: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  reportBadge: { marginRight: spacing.sm },
  clinicRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  clinicMeta: { flex: 1 },
  clinicName: { ...typography.body, fontWeight: '600', color: colors.text },
  clinicRole: { ...typography.bodySmall, color: colors.textSecondary },
  legalLink: { marginTop: spacing.xs },
  legalLinkText: { ...typography.body, color: colors.primary, textDecorationLine: 'underline' },
  btn: { alignSelf: 'flex-start', marginBottom: spacing.sm },
  signOutBtn: {},
});
