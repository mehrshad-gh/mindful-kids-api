import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme';
import { typography } from '../theme/typography';
import { reportProfessional, type ReportProfessionalReason } from '../api/reports';

const REASONS: { value: ReportProfessionalReason; label: string }[] = [
  { value: 'misconduct', label: 'Misconduct' },
  { value: 'inaccurate_info', label: 'Inaccurate or misleading info' },
  { value: 'inappropriate_behavior', label: 'Inappropriate behavior' },
  { value: 'other', label: 'Other' },
];

type Props = {
  visible: boolean;
  psychologistId: string;
  psychologistName: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function ReportProfessionalModal({
  visible,
  psychologistId,
  psychologistName,
  onClose,
  onSuccess,
}: Props) {
  const [reason, setReason] = useState<ReportProfessionalReason>('other');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await reportProfessional({
        psychologist_id: psychologistId,
        reason,
        details: details.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setReason('other');
      setDetails('');
      setError(null);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <TouchableOpacity style={styles.box} activeOpacity={1} onPress={() => {}}>
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Report this professional</Text>
            <Text style={styles.subtitle}>
              Your report is confidential. Our team will review it. This is about: {psychologistName}
            </Text>
            <Text style={styles.label}>Reason</Text>
            {REASONS.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.option, reason === r.value && styles.optionSelected]}
                onPress={() => setReason(r.value)}
              >
                <Text style={[styles.optionText, reason === r.value && styles.optionTextSelected]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.label}>Additional details (optional)</Text>
            <Input
              value={details}
              onChangeText={setDetails}
              placeholder="Any relevant information"
              multiline
              numberOfLines={3}
              style={styles.detailsInput}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.actions}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={handleClose}
                disabled={submitting}
                style={styles.cancelBtn}
              />
              <Button
                title={submitting ? 'Submitting…' : 'Submit report'}
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting}
                style={styles.submitBtn}
              />
            </View>
          </ScrollView>
        </TouchableOpacity>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(45,42,38,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  box: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  option: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: 4,
    backgroundColor: colors.background,
  },
  optionSelected: {
    backgroundColor: colors.primary + '18',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  optionText: {
    ...typography.body,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  detailsInput: {
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {},
  submitBtn: {},
});
