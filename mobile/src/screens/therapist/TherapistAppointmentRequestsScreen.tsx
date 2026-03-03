import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  fetchMyAppointments,
  updateAppointmentStatus,
  type TherapistAppointment,
} from '../../api/therapistAppointments';
import { formatAppointmentTime } from '../../utils/dateTime';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme';

export function TherapistAppointmentRequestsScreen() {
  const [requested, setRequested] = useState<TherapistAppointment[]>([]);
  const [confirmed, setConfirmed] = useState<TherapistAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [declineAptId, setDeclineAptId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [cancelAptId, setCancelAptId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reqList, confList] = await Promise.all([
        fetchMyAppointments({ status: 'requested' }),
        fetchMyAppointments({ status: 'confirmed' }),
      ]);
      setRequested(reqList);
      setConfirmed(confList);
    } catch {
      setRequested([]);
      setConfirmed([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAction = useCallback(
    async (apt: TherapistAppointment, action: 'confirm' | 'decline' | 'cancel', reason?: string | null) => {
      setActionId(apt.id);
      try {
        await updateAppointmentStatus(apt.id, action, reason);
        setDeclineAptId(null);
        setDeclineReason('');
        setCancelAptId(null);
        setCancelReason('');
        await load();
      } catch (e: unknown) {
        const msg =
          e && typeof e === 'object' && 'response' in e
            ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
            : e instanceof Error ? e.message : 'Action failed';
        Alert.alert('Error', String(msg));
      } finally {
        setActionId(null);
      }
    },
    [load]
  );

  const showDeclineReason = (apt: TherapistAppointment) => {
    setDeclineAptId(apt.id);
    setDeclineReason('');
  };

  const submitDecline = (apt: TherapistAppointment) => {
    handleAction(apt, 'decline', declineReason.trim() || undefined);
  };

  const showCancelReason = (apt: TherapistAppointment) => {
    setCancelAptId(apt.id);
    setCancelReason('');
  };

  const submitCancel = (apt: TherapistAppointment) => {
    handleAction(apt, 'cancel', cancelReason.trim() || undefined);
  };

  if (loading && requested.length === 0 && confirmed.length === 0) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <Text style={styles.title}>Appointment requests</Text>
      <Text style={styles.subtitle}>Confirm or decline booking requests. Cancel confirmed appointments if needed.</Text>

      {requested.length === 0 && confirmed.length === 0 ? (
        <Card style={styles.card}>
          <Text style={styles.emptyText}>No pending requests or upcoming confirmed appointments.</Text>
        </Card>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        >
          {requested.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Pending requests</Text>
              {requested.map((apt) => (
                <Card key={apt.id} style={styles.aptCard}>
                  <Text style={styles.aptName}>{apt.parent_name ?? 'Parent'}</Text>
                  {apt.parent_email ? (
                    <Text style={styles.aptEmail}>{apt.parent_email}</Text>
                  ) : null}
                  <Text style={styles.aptTime}>{formatAppointmentTime(apt.starts_at_utc, 'therapist')}</Text>
                  {apt.parent_notes ? (
                    <Text style={styles.aptNotes}>Notes: {apt.parent_notes}</Text>
                  ) : null}
                  {declineAptId === apt.id ? (
                    <View style={styles.reasonBlock}>
                      <Input
                        value={declineReason}
                        onChangeText={setDeclineReason}
                        placeholder="Optional: e.g. Please pick another time"
                        style={styles.reasonInput}
                      />
                      <View style={styles.reasonActions}>
                        <Button
                          title="Confirm decline"
                          onPress={() => submitDecline(apt)}
                          loading={actionId === apt.id}
                          disabled={actionId !== null}
                          style={styles.reasonBtn}
                        />
                        <TouchableOpacity onPress={() => { setDeclineAptId(null); setDeclineReason(''); }}>
                          <Text style={styles.cancelLink}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.actions}>
                      <Button
                        title="Confirm"
                        onPress={() => handleAction(apt, 'confirm')}
                        loading={actionId === apt.id}
                        disabled={actionId !== null}
                        style={styles.actionBtn}
                      />
                      <Button
                        title="Decline"
                        variant="outline"
                        onPress={() => showDeclineReason(apt)}
                        loading={actionId === apt.id}
                        disabled={actionId !== null}
                        style={styles.actionBtn}
                      />
                    </View>
                  )}
                </Card>
              ))}
            </>
          ) : null}
          {confirmed.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Confirmed (upcoming)</Text>
              {confirmed.map((apt) => (
                <Card key={apt.id} style={styles.aptCard}>
                  <Text style={styles.aptName}>{apt.parent_name ?? 'Parent'}</Text>
                  <Text style={styles.aptTime}>{formatAppointmentTime(apt.starts_at_utc, 'therapist')}</Text>
                  {cancelAptId === apt.id ? (
                    <View style={styles.reasonBlock}>
                      <Input
                        value={cancelReason}
                        onChangeText={setCancelReason}
                        placeholder="Optional: reason for cancellation"
                        style={styles.reasonInput}
                      />
                      <View style={styles.reasonActions}>
                        <Button
                          title="Confirm cancel"
                          onPress={() => submitCancel(apt)}
                          loading={actionId === apt.id}
                          disabled={actionId !== null}
                          style={styles.reasonBtn}
                        />
                        <TouchableOpacity onPress={() => { setCancelAptId(null); setCancelReason(''); }}>
                          <Text style={styles.cancelLink}>Back</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <Button
                      title="Cancel appointment"
                      variant="outline"
                      onPress={() => showCancelReason(apt)}
                      loading={actionId === apt.id}
                      disabled={actionId !== null}
                      style={styles.cancelBtn}
                    />
                  )}
                </Card>
              ))}
            </>
          ) : null}
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  card: { marginBottom: spacing.md },
  emptyText: { ...typography.body, color: colors.textSecondary },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl },
  aptCard: { marginBottom: spacing.md },
  aptName: { ...typography.body, fontWeight: '600', color: colors.text },
  aptEmail: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  aptTime: { ...typography.subtitle, color: colors.text, marginTop: spacing.sm },
  aptNotes: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn: { flex: 1 },
  reasonBlock: { marginTop: spacing.sm },
  reasonInput: { marginBottom: spacing.sm },
  reasonActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reasonBtn: {},
  cancelLink: { ...typography.body, color: colors.primary },
  cancelBtn: { marginTop: spacing.sm },
  centered: { paddingVertical: spacing.xl, alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
});
