import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { fetchMyAppointments, cancelAppointment, type Appointment } from '../../api/appointments';
import { formatAppointmentTime } from '../../utils/dateTime';
import type { ParentStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, typography, borderRadius, layout } from '../../theme';

type Nav = NativeStackNavigationProp<ParentStackParamList, 'MyAppointments'>;

function statusLabel(status: Appointment['status']): string {
  const map: Record<Appointment['status'], string> = {
    requested: 'Pending',
    confirmed: 'Confirmed',
    declined: 'Declined',
    cancelled: 'Cancelled',
    completed: 'Completed',
  };
  return map[status] ?? status;
}

function getStatusCounts(appointments: Appointment[]): { requested: number; confirmed: number; declined: number; cancelled: number; completed: number } {
  const counts = { requested: 0, confirmed: 0, declined: 0, cancelled: 0, completed: 0 };
  for (const a of appointments) {
    if (a.status in counts) counts[a.status as keyof typeof counts]++;
  }
  return counts;
}

export function MyAppointmentsScreen() {
  const navigation = useNavigation<Nav>();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchMyAppointments();
      setAppointments(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleCancel = useCallback(
    (apt: Appointment) => {
      Alert.alert(
        'Cancel request?',
        'This will free the slot. The therapist will no longer see this request.',
        [
          { text: 'Keep it', style: 'cancel' },
          {
            text: 'Cancel request',
            style: 'destructive',
            onPress: async () => {
              setCancellingId(apt.id);
              try {
                await cancelAppointment(apt.id);
                await load();
              } catch (e) {
                Alert.alert('Error', e instanceof Error ? e.message : 'Could not cancel.');
              } finally {
                setCancellingId(null);
              }
            },
          },
        ]
      );
    },
    [load]
  );

  const handleBookAgain = useCallback(
    (psychologistId: string) => {
      navigation.navigate('Booking', { psychologistId });
    },
    [navigation]
  );

  if (loading && appointments.length === 0) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </ScreenLayout>
    );
  }

  const requested = appointments.filter((a) => a.status === 'requested');
  const confirmed = appointments.filter((a) => a.status === 'confirmed');
  const past = appointments.filter((a) => ['completed', 'declined', 'cancelled'].includes(a.status));

  const renderAppointment = (apt: Appointment) => (
    <Card key={apt.id} style={styles.aptCard}>
      <Text style={styles.aptName}>{apt.psychologist_name ?? 'Therapist'}</Text>
      <Text style={styles.aptTime}>{formatAppointmentTime(apt.starts_at_utc, 'parent')}</Text>
      <View style={styles.statusRow}>
        <View style={[styles.statusPill, styles[`statusPill_${apt.status}` as keyof typeof styles] as object]}>
          <Text style={[styles.statusPillText, styles[`statusPillText_${apt.status}` as keyof typeof styles] as object]}>
            {statusLabel(apt.status)}
          </Text>
        </View>
      </View>
      {apt.status === 'declined' && apt.cancellation_reason ? (
        <Text style={styles.reasonText}>Therapist: {apt.cancellation_reason}</Text>
      ) : null}
      {apt.status === 'cancelled' && apt.cancellation_reason ? (
        <Text style={styles.reasonText}>Reason: {apt.cancellation_reason}</Text>
      ) : null}
      {apt.parent_notes ? (
        <Text style={styles.aptNotes} numberOfLines={2}>{apt.parent_notes}</Text>
      ) : null}
      {apt.status === 'requested' ? (
        <Button
          title={cancellingId === apt.id ? 'Cancelling…' : 'Cancel request'}
          variant="outline"
          size="small"
          onPress={() => handleCancel(apt)}
          disabled={!!cancellingId}
          style={styles.cardAction}
        />
      ) : null}
      {apt.status === 'declined' ? (
        <TouchableOpacity onPress={() => handleBookAgain(apt.psychologist_id)} style={styles.bookAgain}>
          <Text style={styles.bookAgainText}>Book another time</Text>
        </TouchableOpacity>
      ) : null}
    </Card>
  );

  return (
    <ScreenLayout>
      <Text style={styles.title}>My appointments</Text>
      {error ? (
        <Card style={styles.card}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : appointments.length === 0 ? (
        <Card style={styles.card}>
          <Text style={styles.emptyText}>You have no appointments yet. Book a session from a therapist’s profile.</Text>
        </Card>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        >
          {requested.length > 0 ? (
            <>
              <Text style={styles.sectionHeaderFirst}>Requested</Text>
              {requested.map(renderAppointment)}
            </>
          ) : null}
          {confirmed.length > 0 ? (
            <>
              <Text style={styles.sectionHeader}>Confirmed</Text>
              {confirmed.map(renderAppointment)}
            </>
          ) : null}
          {past.length > 0 ? (
            <>
              <Text style={styles.sectionHeader}>Past</Text>
              {past.map(renderAppointment)}
            </>
          ) : null}
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  card: { marginBottom: spacing.md },
  errorText: { ...typography.body, color: colors.error },
  emptyText: { ...typography.body, color: colors.textSecondary },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl },
  sectionHeader: { ...typography.SectionTitle, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionHeaderFirst: { ...typography.SectionTitle, color: colors.text, marginTop: 0, marginBottom: spacing.sm },
  aptCard: { marginBottom: spacing.md },
  aptName: { ...typography.body, fontWeight: '600', color: colors.text },
  aptTime: { ...typography.subtitle, color: colors.textSecondary, marginTop: spacing.xs },
  statusRow: { marginTop: spacing.sm },
  statusPill: { alignSelf: 'flex-start', paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: borderRadius.full, minHeight: 28, justifyContent: 'center' },
  statusPillText: { ...typography.caption, fontWeight: '600' },
  statusPill_requested: { backgroundColor: colors.warningMuted },
  statusPillText_requested: { color: colors.warning },
  statusPill_confirmed: { backgroundColor: colors.successMuted },
  statusPillText_confirmed: { color: colors.success },
  statusPill_declined: { backgroundColor: colors.errorMuted },
  statusPillText_declined: { color: colors.error },
  statusPill_cancelled: { backgroundColor: colors.surfaceSoft },
  statusPillText_cancelled: { color: colors.textTertiary },
  statusPill_completed: { backgroundColor: colors.surfaceSoft },
  statusPillText_completed: { color: colors.textSecondary },
  reasonText: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs, fontStyle: 'italic' },
  aptNotes: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  cardAction: { marginTop: spacing.sm },
  bookAgain: { marginTop: spacing.sm },
  bookAgainText: { ...typography.body, color: colors.primary, textDecorationLine: 'underline' },
  centered: { paddingVertical: spacing.xl, alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
});
