import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Share,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  getClinicApplication,
  getClinicApplicationDocumentUrl,
  reviewClinicApplication,
} from '../../api/admin';
import type { AdminStackParamList } from '../../types/navigation';
import type { ClinicApplication } from '../../types/therapist';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { layout } from '../../theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminClinicApplicationDetail'>;

export function AdminClinicApplicationDetailScreen({ route, navigation }: Props) {
  const { applicationId } = route.params;
  const [application, setApplication] = useState<ClinicApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [openingDoc, setOpeningDoc] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getClinicApplication(applicationId);
      setApplication(res.application);
    } catch {
      setApplication(null);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleViewDocument = useCallback(async () => {
    if (!application?.has_document) return;
    setOpeningDoc(true);
    try {
      const { url } = await getClinicApplicationDocumentUrl(applicationId);
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
      else Alert.alert('Cannot open', 'This link could not be opened.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not open document.');
    } finally {
      setOpeningDoc(false);
    }
  }, [applicationId, application?.has_document]);

  const handleApprove = () => {
    Alert.alert(
      'Approve application',
      'This will create a verified clinic in the directory. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setActionLoading(true);
            try {
              await reviewClinicApplication(applicationId, 'approved');
              await load();
              Alert.alert(
                'Approved',
                'Clinic created. Invite link is available below — copy and send to the contact email.'
              );
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Could not approve');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = () => {
    setRejectionReason('');
    setRejectModalVisible(true);
  };

  const confirmReject = async () => {
    setActionLoading(true);
    try {
      await reviewClinicApplication(
        applicationId,
        'rejected',
        rejectionReason.trim() || undefined
      );
      setRejectModalVisible(false);
      Alert.alert('Rejected', 'Application has been rejected.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not reject');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !application) {
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
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>Application not found</Text>
        </Card>
      </ScreenLayout>
    );
  }

  const isPending = application.status === 'pending';
  const isApproved = application.status === 'approved';

  const handleCopyInviteLink = useCallback(async () => {
    if (!application.invite_link) return;
    try {
      await Share.share({
        message: application.invite_link,
        title: 'Set password link',
      });
    } catch {
      Alert.alert('Error', 'Could not share link.');
    }
  }, [application.invite_link]);

  return (
    <ScreenLayout>
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        <SectionHeader title="Clinic" />
        <Card style={styles.section}>
          <Text style={styles.name}>{application.clinic_name}</Text>
          <Text style={styles.body}>{application.country}</Text>
          {application.description ? (
            <Text style={[styles.bodySmall, styles.bio]}>{application.description}</Text>
          ) : null}
        </Card>

        <SectionHeader title="Contact" />
        <Card style={styles.section}>
          <Text style={styles.contactLabel}>Contact email</Text>
          <Text style={styles.body}>{application.contact_email}</Text>
          {application.contact_phone ? (
            <Text style={styles.bodySmall}>{application.contact_phone}</Text>
          ) : null}
        </Card>

        {isApproved && (
          <>
            <SectionHeader title="Invite status" />
            <Card style={styles.section}>
              <View style={styles.badgeRow}>
                <StatusBadge
                  label={application.account_created ? 'Account created' : 'Invited'}
                  variant={application.account_created ? 'approved' : 'pending'}
                />
              </View>
              {application.invite_link && !application.account_created && (
                <Button
                  title="Copy invite link"
                  onPress={handleCopyInviteLink}
                  variant="outline"
                  size="small"
                  style={styles.copyBtn}
                />
              )}
            </Card>
          </>
        )}

        {application.has_document && (
          <>
            <SectionHeader title="Document" subtitle="Opens in browser (link valid 5 minutes)" />
            <Card style={styles.section}>
            <TouchableOpacity
              onPress={handleViewDocument}
              disabled={openingDoc}
              style={styles.docLinkWrap}
            >
              {openingDoc ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.link}>View attached document</Text>
              )}
            </TouchableOpacity>
          </Card>
          </>
        )}

        {isPending && (
          <View style={styles.actions}>
            <Button
              title="Approve (create verified clinic)"
              onPress={handleApprove}
              loading={actionLoading}
              style={styles.approveBtn}
            />
            <Button
              title="Reject"
              onPress={handleReject}
              variant="outline"
              loading={actionLoading}
              style={styles.rejectBtn}
            />
          </View>
        )}

        {application.status !== 'pending' && (
          <View style={styles.statusRow}>
            <Text style={styles.bodySmall}>Status: {application.status}</Text>
            {application.reviewed_at ? (
              <Text style={styles.bodySmall}>
                Reviewed {new Date(application.reviewed_at).toLocaleDateString()}
              </Text>
            ) : null}
            {application.rejection_reason ? (
              <Text style={[styles.bodySmall, styles.rejection]}>
                {application.rejection_reason}
              </Text>
            ) : null}
          </View>
        )}
      </ScrollView>

      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRejectModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Reject application</Text>
            <Text style={styles.modalSubtitle}>Optional: add a reason</Text>
            <TextInput
              style={styles.input}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Reason for rejection..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setRejectModalVisible(false)}
              />
              <Button
                title="Reject"
                variant="outline"
                onPress={confirmReject}
                loading={actionLoading}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorCard: { margin: spacing.md },
  errorText: { ...typography.body, color: colors.error },
  section: { marginBottom: layout.sectionGap },
  name: { ...typography.h3, marginBottom: spacing.xs },
  contactLabel: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },
  body: { ...typography.body, marginBottom: spacing.xs },
  bodySmall: { ...typography.bodySmall, color: colors.textSecondary },
  bio: { marginTop: spacing.xs },
  badgeRow: { marginBottom: spacing.sm },
  copyBtn: { alignSelf: 'flex-start' },
  docLinkWrap: { marginTop: spacing.xs },
  link: { ...typography.body, color: colors.primary, fontWeight: '600' },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
  approveBtn: {},
  rejectBtn: {},
  statusRow: { marginTop: spacing.lg },
  rejection: { marginTop: spacing.sm, color: colors.text },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
  },
  modalTitle: { ...typography.h3, marginBottom: spacing.xs },
  modalSubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    ...typography.body,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
});
