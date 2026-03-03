import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { fetchPsychologistAvailability, type AvailabilitySlot } from '../../api/availability';
import { createAppointment } from '../../api/appointments';
import { fetchPsychologistById } from '../../api/psychologists';
import type { ParentStackParamList } from '../../types/navigation';
import { formatAppointmentTime } from '../../utils/dateTime';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<ParentStackParamList, 'Booking'>;

export function BookingScreen({ route, navigation }: Props) {
  const { psychologistId } = route.params;
  const [psychologistName, setPsychologistName] = useState<string>('');
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [parentNotes, setParentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 14);
      const [slotsRes, profileRes] = await Promise.all([
        fetchPsychologistAvailability(psychologistId, {
          from: from.toISOString(),
          to: to.toISOString(),
        }),
        fetchPsychologistById(psychologistId),
      ]);
      setSlots(slotsRes);
      setPsychologistName(profileRes?.psychologist?.name ?? 'Therapist');
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [psychologistId]);

  useFocusEffect(
    useCallback(() => {
      load();
      setSelectedSlot(null);
      setParentNotes('');
    }, [load])
  );

  const handleConfirm = useCallback(async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      await createAppointment({
        therapist_id: psychologistId,
        availability_slot_id: selectedSlot.id,
        parent_notes: parentNotes.trim() || undefined,
      });
      Alert.alert(
        'Request sent',
        'Your booking request has been sent. The therapist will confirm or decline.',
        [{ text: 'OK', onPress: () => navigation.navigate('MyAppointments') }]
      );
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : e instanceof Error
            ? e.message
            : 'Booking failed';
      Alert.alert('Booking failed', String(msg));
    } finally {
      setSubmitting(false);
    }
  }, [psychologistId, selectedSlot, parentNotes, navigation]);

  if (loading && slots.length === 0) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading availability…</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <Text style={styles.title}>Book with {psychologistName}</Text>
      <Text style={styles.subtitle}>Choose a time (next 14 days)</Text>

      {slots.length === 0 ? (
        <Card style={styles.card}>
          <Text style={styles.emptyText}>
            No available slots in the next 14 days. Check back later.
          </Text>
        </Card>
      ) : (
        <>
          <ScrollView style={styles.slotList} showsVerticalScrollIndicator={false}>
            {slots.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[styles.slotCard, selectedSlot?.id === slot.id && styles.slotCardSelected]}
                onPress={() => setSelectedSlot(slot)}
                activeOpacity={0.7}
              >
                <Text style={styles.slotText}>{formatAppointmentTime(slot.starts_at_utc, 'parent')}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedSlot ? (
            <Card style={styles.confirmCard}>
              <Text style={styles.confirmLabel}>Selected</Text>
              <Text style={styles.confirmTime}>{formatAppointmentTime(selectedSlot.starts_at_utc, 'parent')}</Text>
              <Input
                value={parentNotes}
                onChangeText={setParentNotes}
                placeholder="Notes for the therapist (optional)"
                multiline
                numberOfLines={2}
                style={styles.notesInput}
              />
              <Button
                title="Confirm booking request"
                onPress={handleConfirm}
                loading={submitting}
                disabled={submitting}
                style={styles.confirmBtn}
              />
            </Card>
          ) : null}
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  card: { marginBottom: spacing.md },
  emptyText: { ...typography.body, color: colors.textSecondary },
  slotList: { maxHeight: 280, marginBottom: spacing.md },
  slotCard: {
    padding: spacing.md,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  slotCardSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  slotText: { ...typography.body, color: colors.text },
  confirmCard: { marginTop: spacing.sm },
  confirmLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  confirmTime: { ...typography.body, fontWeight: '600', marginBottom: spacing.md },
  notesInput: { marginBottom: spacing.md },
  confirmBtn: {},
  centered: { paddingVertical: spacing.xl, alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
});
