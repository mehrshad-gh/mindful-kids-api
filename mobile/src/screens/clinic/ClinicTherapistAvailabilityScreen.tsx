import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { ClinicStackParamList } from '../../types/navigation';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  listPsychologistAvailability,
  createPsychologistSlot,
  deleteClinicAvailabilitySlot,
  type ClinicAvailabilitySlot,
} from '../../api/clinicAdmin';
import { getDeviceTimezone, getTimezoneShortLabel, formatSlotTimeWithTz } from '../../utils/dateTime';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme';

const DURATIONS = [15, 30, 45, 60, 90, 120];

function getDefaultStartDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(14, 0, 0, 0);
  return d;
}

function formatSlotTime(slot: ClinicAvailabilitySlot): string {
  const start = formatSlotTimeWithTz(slot.starts_at_utc);
  const end = new Date(slot.ends_at_utc).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${start} – ${end}`;
}

function createdByLabel(slot: ClinicAvailabilitySlot): string {
  return slot.created_by_role === 'clinic_admin' ? 'Created by clinic' : 'Created by therapist';
}

export function ClinicTherapistAvailabilityScreen() {
  const route = useRoute<RouteProp<ClinicStackParamList, 'ClinicTherapistAvailability'>>();
  const navigation = useNavigation();
  const { psychologistId, psychologistName } = route.params;
  const [slots, setSlots] = useState<ClinicAvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(() => getDefaultStartDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [duration, setDuration] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const timezone = getDeviceTimezone();
  const timezoneLabel = getTimezoneShortLabel(timezone);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 60);
      const { slots: list } = await listPsychologistAvailability(psychologistId, {
        from: from.toISOString(),
        to: to.toISOString(),
      });
      setSlots(list ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [psychologistId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = useCallback(async () => {
    const start = new Date(startDate);
    if (start < new Date()) {
      Alert.alert('Invalid date', 'Start must be in the future.');
      return;
    }
    const end = new Date(start.getTime() + duration * 60 * 1000);
    setSubmitting(true);
    try {
      await createPsychologistSlot(psychologistId, {
        starts_at_utc: start.toISOString(),
        ends_at_utc: end.toISOString(),
      });
      setStartDate(getDefaultStartDate());
      await load();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : e instanceof Error ? e.message : 'Failed to create slot';
      Alert.alert('Error', String(msg));
    } finally {
      setSubmitting(false);
    }
  }, [psychologistId, startDate, duration, load]);

  const handleDelete = useCallback(
    (slot: ClinicAvailabilitySlot) => {
      if (slot.status !== 'open') {
        Alert.alert('Cannot delete', 'Only open slots can be deleted.');
        return;
      }
      if (new Date(slot.starts_at_utc) <= new Date()) {
        Alert.alert('Cannot delete', 'Only future slots can be deleted.');
        return;
      }
      Alert.alert('Delete slot?', formatSlotTime(slot), [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClinicAvailabilitySlot(slot.id, slot.version ?? undefined);
              await load();
            } catch (e: unknown) {
              const msg =
                e && typeof e === 'object' && 'response' in e
                  ? (e as { response?: { data?: { error?: string }; status?: number } }).response?.status === 409
                    ? 'Slot was modified; please refresh and try again.'
                    : (e as { response?: { data?: { error?: string } } }).response?.data?.error
                  : 'Could not delete slot.';
              Alert.alert('Error', String(msg));
            }
          },
        },
      ]);
    },
    [load]
  );

  return (
    <ScreenLayout>
      <Text style={styles.title}>Availability for {psychologistName ?? 'Therapist'}</Text>
      <Text style={styles.subtitle}>Add or remove slots. Therapist can also manage their own.</Text>

      <Card style={styles.card}>
        <Text style={styles.cardLabel}>New slot</Text>
        <Text style={styles.timezoneLabel}>Timezone: {timezone}</Text>
        <Text style={styles.timezoneHint}>Times are in your local time ({timezoneLabel}).</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.pickerButton}>
          <Text style={styles.pickerButtonText}>
            Date: {startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            minimumDate={new Date()}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, d) => {
              if (Platform.OS !== 'ios') setShowDatePicker(false);
              if (d) setStartDate(d);
            }}
          />
        )}
        {Platform.OS === 'ios' && showDatePicker && (
          <View style={styles.iosPickerActions}>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Text style={styles.iosPickerDone}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.pickerButton}>
          <Text style={styles.pickerButtonText}>
            Time: {startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
          </Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={startDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, d) => {
              if (Platform.OS !== 'ios') setShowTimePicker(false);
              if (d) setStartDate(d);
            }}
          />
        )}
        {Platform.OS === 'ios' && showTimePicker && (
          <View style={styles.iosPickerActions}>
            <TouchableOpacity onPress={() => setShowTimePicker(false)}>
              <Text style={styles.iosPickerDone}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.durationLabel}>Duration (minutes)</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.durChip, duration === d && styles.durChipActive]}
              onPress={() => setDuration(d)}
            >
              <Text style={[styles.durChipText, duration === d && styles.durChipTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Button title="Add slot" onPress={handleAdd} loading={submitting} disabled={submitting} style={styles.addBtn} />
      </Card>

      <Text style={styles.sectionTitle}>Slots</Text>
      {loading && slots.length === 0 ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      ) : slots.length === 0 ? (
        <Card style={styles.card}>
          <Text style={styles.emptyText}>No slots yet. Add one above.</Text>
        </Card>
      ) : (
        <ScrollView style={styles.slotList} showsVerticalScrollIndicator={false}>
          {slots.map((slot) => (
            <Card key={slot.id} style={styles.slotCard}>
              <Text style={styles.slotText}>{formatSlotTime(slot)}</Text>
              <Text style={styles.slotMeta}>
                {slot.status} · {createdByLabel(slot)}
              </Text>
              {slot.status === 'open' && new Date(slot.starts_at_utc) > new Date() ? (
                <TouchableOpacity onPress={() => handleDelete(slot)} style={styles.deleteLink}>
                  <Text style={styles.deleteLinkText}>Delete</Text>
                </TouchableOpacity>
              ) : null}
            </Card>
          ))}
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  card: { marginBottom: spacing.md },
  cardLabel: { ...typography.label, marginBottom: spacing.sm },
  timezoneLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  timezoneHint: { ...typography.bodySmall, color: colors.textTertiary, marginBottom: spacing.sm },
  pickerButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  pickerButtonText: { ...typography.body, color: colors.text },
  iosPickerActions: { marginBottom: spacing.sm },
  iosPickerDone: { ...typography.body, color: colors.primary, fontWeight: '600' },
  durationLabel: { ...typography.caption, marginBottom: spacing.xs },
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  durChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surfaceSubtle,
  },
  durChipActive: { backgroundColor: colors.primaryLight },
  durChipText: { ...typography.body, color: colors.textSecondary },
  durChipTextActive: { ...typography.body, color: colors.primary, fontWeight: '600' },
  addBtn: {},
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  loader: { marginVertical: spacing.md },
  emptyText: { ...typography.body, color: colors.textSecondary },
  slotList: { maxHeight: 400 },
  slotCard: { marginBottom: spacing.sm },
  slotText: { ...typography.body, color: colors.text },
  slotMeta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  deleteLink: { marginTop: spacing.xs },
  deleteLinkText: { ...typography.caption, color: colors.error },
});
