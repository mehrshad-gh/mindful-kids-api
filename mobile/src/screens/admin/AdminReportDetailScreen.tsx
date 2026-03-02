import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  getReport,
  updateReport,
  setPsychologistStatus,
  type AdminReportListItem,
  type ProfessionalReportStatus,
  type ProfessionalReportActionTaken,
} from '../../api/admin';
import type { AdminStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminReportDetail'>;

const STATUS_OPTIONS: { value: ProfessionalReportStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Under review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

const ACTION_OPTIONS: { value: ProfessionalReportActionTaken; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'warning', label: 'Warning issued' },
  { value: 'temporary_suspension', label: 'Temporary suspension' },
  { value: 'verification_revoked', label: 'Verification revoked' },
];

const REASON_LABELS: Record<string, string> = {
  misconduct: 'Misconduct',
  inaccurate_info: 'Inaccurate info',
  inappropriate_behavior: 'Inappropriate behavior',
  other: 'Other',
};

export function AdminReportDetailScreen({ route }: Props) {
  const { reportId } = route.params;
  const [report, setReport] = useState<AdminReportListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReport(reportId);
      setReport(res.report);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleStatusChange = (status: ProfessionalReportStatus) => {
    Alert.alert(
      'Update status',
      `Set report status to "${STATUS_OPTIONS.find((o) => o.value === status)?.label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setSaving(true);
            try {
              const res = await updateReport(reportId, { status });
              setReport(res.report);
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not update');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handlePsychologistStatus = (status: 'active' | 'suspended' | 'rejected') => {
    const label = status === 'active' ? 'Active' : status === 'suspended' ? 'Suspended' : 'Rejected';
    Alert.alert(
      'Set professional status',
      `Set this professional's profile status to "${label}"? This affects their visibility and verification badge.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setStatusLoading(true);
            try {
              await setPsychologistStatus(report!.psychologist_id, status);
              Alert.alert('Updated', `Professional status set to ${label}.`);
              load();
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not update status');
            } finally {
              setStatusLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleActionChange = (action_taken: ProfessionalReportActionTaken) => {
    const label = ACTION_OPTIONS.find((o) => o.value === action_taken)?.label;
    const isEnforcement =
      action_taken === 'temporary_suspension' || action_taken === 'verification_revoked';
    Alert.alert(
      'Set action taken',
      isEnforcement
        ? `${label} will update the professional's verification status. Continue?`
        : `Set action taken to "${label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setSaving(true);
            try {
              const res = await updateReport(reportId, { action_taken });
              setReport(res.report);
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not update');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading && !report) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenLayout>
    );
  }

  if (!report) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <Text style={styles.error}>Report not found.</Text>
        </View>
      </ScreenLayout>
    );
  }

  const reasonLabel = REASON_LABELS[report.reason] ?? report.reason;
  const createdStr = report.created_at
    ? new Date(report.created_at).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <ScreenLayout>
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Text style={styles.label}>Reason</Text>
          <Text style={styles.value}>{reasonLabel}</Text>
          <Text style={styles.label}>Psychologist ID</Text>
          <Text style={styles.value}>{report.psychologist_id}</Text>
          <Text style={styles.label}>Reporter ID</Text>
          <Text style={styles.value}>{report.reporter_id}</Text>
          <Text style={styles.label}>Submitted</Text>
          <Text style={styles.value}>{createdStr}</Text>
          {report.details ? (
            <>
              <Text style={styles.label}>Details</Text>
              <Text style={styles.details}>{report.details}</Text>
            </>
          ) : null}
        </Card>

        <Text style={styles.sectionTitle}>Professional status</Text>
        <Text style={styles.value}>Moderate the reported professional's profile (visibility and verification).</Text>
        <View style={styles.chips}>
          <TouchableOpacity
            style={styles.chip}
            onPress={() => handlePsychologistStatus('active')}
            disabled={statusLoading}
          >
            <Text style={styles.chipText}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chip}
            onPress={() => handlePsychologistStatus('suspended')}
            disabled={statusLoading}
          >
            <Text style={styles.chipText}>Suspended</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chip}
            onPress={() => handlePsychologistStatus('rejected')}
            disabled={statusLoading}
          >
            <Text style={styles.chipText}>Rejected</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Report status</Text>
        <View style={styles.chips}>
          {STATUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, report.status === opt.value && styles.chipActive]}
              onPress={() => handleStatusChange(opt.value)}
              disabled={saving || report.status === opt.value}
            >
              <Text
                style={[
                  styles.chipText,
                  report.status === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Action taken</Text>
        <View style={styles.chips}>
          {ACTION_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.chip,
                (report.action_taken || 'none') === opt.value && styles.chipActive,
              ]}
              onPress={() => handleActionChange(opt.value)}
              disabled={saving}
            >
              <Text
                style={[
                  styles.chipText,
                  (report.action_taken || 'none') === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {(report.action_taken === 'temporary_suspension' ||
          report.action_taken === 'verification_revoked') && (
          <Text style={styles.note}>
            This report's action has updated the professional's verification status.
          </Text>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  error: { ...typography.body, color: colors.error },
  card: { marginBottom: spacing.lg },
  label: { ...typography.label, color: colors.textSecondary, marginTop: spacing.sm },
  value: { ...typography.body, marginBottom: spacing.xs },
  details: { ...typography.body, color: colors.text, marginTop: spacing.xs },
  sectionTitle: { ...typography.label, color: colors.primary, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.bodySmall, color: colors.text },
  chipTextActive: { ...typography.bodySmall, color: colors.surface },
  note: { ...typography.bodySmall, color: colors.textSecondary },
});
