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
import { HeaderBar } from '../../components/layout/HeaderBar';
import { colors } from '../../theme/colors';
import { spacing, typography, borderRadius, layout } from '../../theme';

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

  const formatSlotLabel = (isoUtc: string) => {
    const d = new Date(isoUtc);
    const day = d.toLocaleDateString(undefined, { weekday: 'short' });
    const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${day} ${time}`;
  };

  return (
    <ScreenLayout>
      <HeaderBar title={`Book with ${psychologistName}`} subtitle="Choose a time (next 14 days)" />

      {slots.length === 0 ? (
        <Card style={styles.card}>
          <Text style={styles.emptyText}>
            No available slots in the next 14 days. Check back later.
          </Text>
        </Card>
      ) : (
        <>
          <Text style={styles.slotSectionLabel}>Available times</Text>
          <View style={styles.slotPillWrap}>
            {slots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[styles.slotPill, isSelected && styles.slotPillSelected]}
                  onPress={() => setSelectedSlot(slot)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.slotPillText, isSelected && styles.slotPillTextSelected]} numberOfLines={1}>
                    {formatSlotLabel(slot.starts_at_utc)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedSlot ? (
            <Card style={styles.confirmCard} title="Selected time" subtitle={formatSlotLabel(selectedSlot.starts_at_utc)}>
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
                size="large"
              />
            </Card>
          ) : null}
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  emptyText: { ...typography.body, color: colors.textSecondary },
  slotSectionLabel: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.md },
  slotPillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg },
  slotPill: {
    minHeight: layout.touchTargetMin,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md + 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  slotPillSelected: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  slotPillText: { ...typography.body, color: colors.text, fontWeight: '500' },
  slotPillTextSelected: { color: colors.primaryDark, fontWeight: '600' },
  confirmCard: { marginTop: spacing.sm },
  notesInput: { marginBottom: spacing.md },
  confirmBtn: {},
  centered: { paddingVertical: spacing.xl, alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
});
