import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  TouchableOpacity,
  Linking,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  getTherapistApplication,
  reviewTherapistApplication,
  type AdminApplicationDetailResponse,
} from '../../api/admin';
import { getBaseURL } from '../../lib/apiClient';
import { getToken } from '../../services/tokenStorage';
import type { AdminStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<AdminStackParamList, 'TherapistApplicationDetail'>;

/** Open a credential document: if it's our API URL, download with auth and open; else open in browser. */
async function openCredentialDocument(documentUrl: string): Promise<void> {
  const base = getBaseURL();
  const isOurApi = documentUrl.startsWith(base);
  if (!isOurApi) {
    const can = await Linking.canOpenURL(documentUrl);
    if (can) await Linking.openURL(documentUrl);
    else Alert.alert('Cannot open', 'This link could not be opened.');
    return;
  }
  try {
    const token = await getToken();
    if (!token) {
      Alert.alert('Error', 'You must be signed in to view this document.');
      return;
    }
    const filename = documentUrl.split('/').pop() || `credential_${Date.now()}.pdf`;
    const ext = filename.includes('.') ? filename.slice(filename.lastIndexOf('.')) : '.pdf';
    const localUri = `${FileSystem.cacheDirectory}cred_${Date.now()}${ext}`;
    await FileSystem.downloadAsync(documentUrl, localUri, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const can = await Linking.canOpenURL(localUri);
    if (can) await Linking.openURL(localUri);
    else Alert.alert('Opened', 'Document downloaded. Open it from your device storage if needed.');
  } catch (e) {
    Alert.alert('Could not open document', e instanceof Error ? e.message : 'Download failed.');
  }
}

export function AdminApplicationDetailScreen({ route, navigation }: Props) {
  const { applicationId } = route.params;
  const [data, setData] = useState<AdminApplicationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [openingDocUrl, setOpeningDocUrl] = useState<string | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTherapistApplication(applicationId);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleApprove = () => {
    Alert.alert(
      'Approve application',
      'This will create a verified public profile for this therapist. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setActionLoading(true);
            try {
              await reviewTherapistApplication(applicationId, 'approved');
              Alert.alert('Approved', 'Profile created with verified badge.');
              navigation.goBack();
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
      await reviewTherapistApplication(applicationId, 'rejected', rejectionReason.trim() || undefined);
      setRejectModalVisible(false);
      Alert.alert('Rejected', 'The applicant has been notified.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not reject');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenLayout>
    );
  }

  if (!data?.application) {
    return (
      <ScreenLayout>
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>Application not found</Text>
        </Card>
      </ScreenLayout>
    );
  }

  const app = data.application;
  const isPending = app.status === 'pending';
  const isApprovedButSuspended =
    app.status === 'approved' &&
    (app.psychologist_verification_status === 'suspended' ||
      app.psychologist_verification_status === 'rejected');

  return (
    <ScreenLayout>
      <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
        {isApprovedButSuspended && (
          <Card style={styles.suspendedBanner}>
            <Text style={styles.suspendedBannerText}>
              This profile is currently {app.psychologist_verification_status === 'rejected' ? 'revoked' : 'suspended'} (e.g. after a report). The application was approved but the linked psychologist verification has been updated.
            </Text>
          </Card>
        )}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Applicant</Text>
          <Text style={styles.name}>{app.professional_name}</Text>
          <Text style={styles.body}>{data.user_email ?? app.email}</Text>
          {data.user_name ? <Text style={styles.bodySmall}>Account: {data.user_name}</Text> : null}
          {app.phone ? <Text style={styles.body}>{app.phone}</Text> : null}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Professional</Text>
          {app.specialty ? <Text style={styles.body}>{app.specialty}</Text> : null}
          {app.specialization?.length ? (
            <Text style={styles.bodySmall}>{app.specialization.join(', ')}</Text>
          ) : null}
          {app.bio ? <Text style={[styles.bodySmall, styles.bio]}>{app.bio}</Text> : null}
          {app.location ? <Text style={styles.bodySmall}>📍 {app.location}</Text> : null}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Credentials</Text>
          {app.credentials?.length ? (
            app.credentials.map((c, i) => (
              <View key={i} style={styles.credRow}>
                <Text style={styles.bodySmall}>
                  {c.type}{c.issuer ? ` · ${c.issuer}` : ''}{c.number ? ` #${c.number}` : ''}
                </Text>
                {c.document_url ? (
                  <TouchableOpacity
                    onPress={() => {
                      setOpeningDocUrl(c.document_url!);
                      openCredentialDocument(c.document_url!)
                        .finally(() => setOpeningDocUrl(null));
                    }}
                    disabled={openingDocUrl !== null}
                    style={styles.docLinkWrap}
                  >
                    {openingDocUrl === c.document_url ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={styles.link}>View attached document</Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.bodySmall}>None</Text>
          )}
        </Card>

        {data.clinic_affiliations?.length ? (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Clinic affiliations</Text>
            {data.clinic_affiliations.map((a, i) => (
              <Text key={i} style={styles.bodySmall}>
                Clinic {a.clinic_id}{a.role_label ? ` · ${a.role_label}` : ''}{a.is_primary ? ' (Primary)' : ''}
              </Text>
            ))}
          </Card>
        ) : null}

        {isPending && (
          <View style={styles.actions}>
            <Button
              title="Approve (assign verified badge)"
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

        {app.status !== 'pending' && (
          <View style={styles.statusRow}>
            <Text style={styles.bodySmall}>Status: {app.status}</Text>
            {app.reviewed_at ? (
              <Text style={styles.bodySmall}>Reviewed {new Date(app.reviewed_at).toLocaleDateString()}</Text>
            ) : null}
            {app.rejection_reason ? (
              <Text style={[styles.bodySmall, styles.rejection]}>{app.rejection_reason}</Text>
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
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject application</Text>
            <Text style={styles.modalSubtitle}>Optional: add a reason (visible to applicant)</Text>
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
              <Button title="Cancel" variant="ghost" onPress={() => setRejectModalVisible(false)} />
              <Button title="Reject" variant="outline" onPress={confirmReject} loading={actionLoading} />
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
  errorText: { color: colors.error },
  suspendedBanner: { marginBottom: spacing.md, borderLeftWidth: 4, borderLeftColor: colors.warning },
  suspendedBannerText: { ...typography.bodySmall, color: colors.text },
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.label, color: colors.primary, marginBottom: spacing.sm },
  name: { ...typography.h3, marginBottom: spacing.xs },
  body: { ...typography.body, marginBottom: spacing.xs },
  bodySmall: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs },
  bio: { marginTop: spacing.xs },
  credRow: { marginBottom: spacing.sm },
  docLinkWrap: { marginTop: 4, alignSelf: 'flex-start' },
  link: { fontSize: 14, color: colors.primary },
  actions: { marginTop: spacing.lg },
  approveBtn: { marginBottom: spacing.sm },
  rejectBtn: {},
  statusRow: { marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.surface, borderRadius: 12 },
  rejection: { color: colors.error, marginTop: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.lg },
  modalTitle: { ...typography.h3, marginBottom: spacing.xs },
  modalSubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
});
