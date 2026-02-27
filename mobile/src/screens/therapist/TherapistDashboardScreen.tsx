import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { getApplication } from '../../api/therapist';
import type { ApplicationStatus } from '../../types/therapist';
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

export function TherapistDashboardScreen() {
  const { user, setAppRole, logout } = useAuth();
  const navigation = useNavigation();
  const [status, setStatus] = useState<ApplicationStatus | null>(null);
  const [psychologistVerificationStatus, setPsychologistVerificationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await getApplication();
          if (!cancelled && res.application) {
            setStatus(res.application.status);
            setPsychologistVerificationStatus(res.application.psychologist_verification_status ?? null);
          } else if (!cancelled) {
            setStatus(null);
            setPsychologistVerificationStatus(null);
          }
        } catch (e) {
          if (!cancelled) setError('Could not load application.');
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

  return (
    <ScreenLayout>
      <View style={styles.container}>
        <Text style={styles.greeting}>Hello, {user?.name ?? 'Therapist'}</Text>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Application status</Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : status ? (
            <>
              {status === 'approved' &&
              (psychologistVerificationStatus === 'suspended' || psychologistVerificationStatus === 'rejected') ? (
                <>
                  <View
                    style={[
                      styles.badge,
                      psychologistVerificationStatus === 'rejected' ? styles.badgeRejected : styles.badgeSuspended,
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {psychologistVerificationStatus === 'rejected' ? 'Revoked' : 'Suspended'}
                    </Text>
                  </View>
                  <Text style={styles.message}>
                    {psychologistVerificationStatus === 'rejected' ? REVOKED_MESSAGE : SUSPENDED_MESSAGE}
                  </Text>
                </>
              ) : (
                <>
                  <View style={[styles.badge, status === 'draft' && styles.badgeDraft, status === 'pending' && styles.badgePending, status === 'approved' && styles.badgeApproved, status === 'rejected' && styles.badgeRejected]}>
                    <Text style={styles.badgeText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                  </View>
                  <Text style={styles.message}>{STATUS_MESSAGES[status]}</Text>
                </>
              )}
            </>
          ) : (
            <Text style={styles.message}>You don’t have an application yet. Complete therapist onboarding to apply.</Text>
          )}
        </Card>
        {canStartOrContinue && (
          <Button
            title={!status ? 'Start application' : status === 'draft' ? 'Continue application' : 'Reapply'}
            onPress={openApplication}
            style={styles.btn}
          />
        )}
        <Button title="Use app as Parent" onPress={useAsParent} style={styles.btn} />
        <Button title="Sign out" onPress={logout} variant="ghost" style={styles.signOutBtn} />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  greeting: { ...typography.h2, color: colors.text, marginBottom: spacing.lg },
  card: { marginBottom: spacing.lg },
  cardTitle: { ...typography.body, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  loader: { marginVertical: spacing.sm },
  error: { ...typography.body, color: colors.error },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 6, marginBottom: spacing.sm },
  badgeDraft: { backgroundColor: colors.textSecondary + '30' },
  badgePending: { backgroundColor: colors.primary + '30' },
  badgeApproved: { backgroundColor: colors.success + '30' },
  badgeRejected: { backgroundColor: colors.error + '30' },
  badgeSuspended: { backgroundColor: colors.warning + '40' },
  badgeText: { ...typography.bodySmall, fontWeight: '600', color: colors.text },
  message: { ...typography.body, color: colors.textSecondary },
  btn: { alignSelf: 'flex-start', marginBottom: spacing.sm },
  signOutBtn: {},
});
