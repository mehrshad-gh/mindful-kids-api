import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  Share,
} from 'react-native';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  getAdminClinic,
  setClinicStatus,
  addClinicAdmin,
  removeClinicAdmin,
} from '../../api/admin';
import type { AdminStackParamList } from '../../types/navigation';
import type { AdminClinicDetailResponse } from '../../types/therapist';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminClinicDetail'>;

function statusLabel(v?: string | null): string {
  if (v === 'verified') return 'Verified';
  if (v === 'suspended') return 'Suspended';
  if (v === 'rejected') return 'Rejected';
  if (v === 'pending') return 'Pending';
  return v ?? '—';
}

function inviteExpiryText(expiresAt: string): string {
  const exp = new Date(expiresAt);
  const now = new Date();
  const ms = exp.getTime() - now.getTime();
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (days < 0) return 'Expired';
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires in 1 day';
  return `Expires in ${days} days`;
}

export function AdminClinicDetailScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const clinicId = route.params.clinicId;
  const [data, setData] = useState<AdminClinicDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [addAdminModalVisible, setAddAdminModalVisible] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addName, setAddName] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await getAdminClinic(clinicId);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clinicId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const handleStatusChange = (status: 'active' | 'suspended' | 'rejected') => {
    const label = status === 'active' ? 'Active' : status === 'suspended' ? 'Suspended' : 'Rejected';
    Alert.alert(
      'Set clinic status',
      `Set this clinic to "${label}"? This affects its visibility in the directory.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setStatusLoading(true);
            try {
              await setClinicStatus(clinicId, status);
              Alert.alert('Success', 'Clinic status updated.');
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

  const handleRemoveAdmin = (userId: string, name: string) => {
    Alert.alert(
      'Remove admin',
      `Remove ${name} from this clinic? They will lose access to manage this clinic.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemoveLoading(userId);
            try {
              await removeClinicAdmin(clinicId, userId);
              Alert.alert('Success', 'Clinic admin removed.');
              load();
            } catch (e: unknown) {
              const msg =
                (e as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                (e instanceof Error ? e.message : 'Could not remove admin');
              Alert.alert('Error', msg);
            } finally {
              setRemoveLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleAddAdminSubmit = async () => {
    const email = addEmail.trim().toLowerCase();
    if (!email) {
      Alert.alert('Error', 'Email is required.');
      return;
    }
    setAddLoading(true);
    try {
      const res = await addClinicAdmin(clinicId, { email, name: addName.trim() || undefined });
      setAddAdminModalVisible(false);
      setAddEmail('');
      setAddName('');
      if ('invite_link' in res && res.invite_link) {
        Alert.alert(
          'Invite created',
          'Share this link so they can set a password and sign in.',
          [
            { text: 'OK', onPress: () => load() },
            {
              text: 'Share link',
              onPress: async () => {
                try {
                  await Share.share({ message: res.invite_link, title: 'Clinic invite link' });
                } catch (_) {}
                load();
              },
            },
          ]
        );
      } else {
        Alert.alert('Success', 'Clinic admin added.');
        load();
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not add admin');
    } finally {
      setAddLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <ScreenLayout scroll={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (!data) {
    return (
      <ScreenLayout scroll={false}>
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>Could not load clinic.</Text>
        </Card>
      </ScreenLayout>
    );
  }

  const { clinic, therapists, clinic_admins, invite_status } = data;
  const vs = clinic.verification_status;

  return (
    <ScreenLayout scroll={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Clinic profile */}
        <Text style={styles.sectionTitle}>Clinic profile</Text>
        <Card style={styles.card}>
          <Text style={styles.clinicName}>{clinic.name}</Text>
          <View style={styles.profileRow}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{statusLabel(vs)}</Text>
          </View>
          {clinic.country ? (
            <View style={styles.profileRow}>
              <Text style={styles.label}>Country</Text>
              <Text style={styles.value}>{clinic.country}</Text>
            </View>
          ) : null}
          {clinic.website ? (
            <View style={styles.profileRow}>
              <Text style={styles.label}>Website</Text>
              <Text style={styles.value} numberOfLines={1}>{clinic.website}</Text>
            </View>
          ) : null}
          {clinic.phone ? (
            <View style={styles.profileRow}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{clinic.phone}</Text>
            </View>
          ) : null}
        </Card>

        {/* Status controls */}
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.statusRow}>
          <TouchableOpacity
            style={[styles.statusChip, vs === 'verified' && styles.statusChipActive]}
            onPress={() => handleStatusChange('active')}
            disabled={statusLoading}
          >
            <Text style={[styles.statusChipText, vs === 'verified' && styles.statusChipTextActive]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusChip, vs === 'suspended' && styles.statusChipActive]}
            onPress={() => handleStatusChange('suspended')}
            disabled={statusLoading}
          >
            <Text style={[styles.statusChipText, vs === 'suspended' && styles.statusChipTextActive]}>Suspended</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusChip, vs === 'rejected' && styles.statusChipActive]}
            onPress={() => handleStatusChange('rejected')}
            disabled={statusLoading}
          >
            <Text style={[styles.statusChipText, vs === 'rejected' && styles.statusChipTextActive]}>Rejected</Text>
          </TouchableOpacity>
        </View>

        {/* Therapists */}
        <Text style={styles.sectionTitle}>Therapists ({therapists.length})</Text>
        {therapists.length === 0 ? (
          <Text style={styles.emptyText}>No affiliated therapists.</Text>
        ) : (
          therapists.map((t) => (
            <TouchableOpacity
              key={t.id}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AdminPsychologistDetail', { psychologistId: t.id })}
            >
              <Card style={styles.smallCard}>
                <Text style={styles.therapistName}>{t.name}</Text>
                {t.specialty ? <Text style={styles.caption}>{t.specialty}</Text> : null}
                {t.verification_status ? (
                  <Text style={styles.caption}>Status: {t.verification_status}</Text>
                ) : null}
                <Text style={styles.tapHint}>Tap to view detail</Text>
              </Card>
            </TouchableOpacity>
          ))
        )}

        {/* Clinic admins */}
        <Text style={styles.sectionTitle}>Clinic admins</Text>
        <Button
          title="Add admin"
          onPress={() => setAddAdminModalVisible(true)}
          style={styles.addAdminBtn}
        />
        {clinic_admins.length === 0 && (!invite_status || invite_status.length === 0) ? (
          <Text style={styles.emptyText}>No admins yet. Add by email or invite.</Text>
        ) : (
          <>
            {clinic_admins.map((a) => (
              <Card key={a.user_id} style={styles.smallCard}>
                <View style={styles.adminRow}>
                  <View style={styles.adminInfo}>
                    <Text style={styles.adminName}>{a.name || '—'}</Text>
                    <Text style={styles.caption}>{a.email}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveAdmin(a.user_id, a.name || a.email)}
                    disabled={removeLoading === a.user_id}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
            {invite_status && invite_status.length > 0 ? (
              <>
                <Text style={styles.inviteLabel}>Pending invite(s)</Text>
                {invite_status.map((inv) => (
                  <Card key={inv.invite_id} style={styles.smallCard}>
                    <Text style={styles.caption}>{inv.contact_email}</Text>
                    <Text style={styles.inviteExpiry}>{inviteExpiryText(inv.expires_at)}</Text>
                  </Card>
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      <Modal visible={addAdminModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add clinic admin</Text>
            <Text style={styles.modalHint}>Enter email. If the user exists they are added; otherwise an invite is created.</Text>
            <TextInput
              style={styles.input}
              placeholder="Email *"
              placeholderTextColor={colors.textTertiary}
              value={addEmail}
              onChangeText={setAddEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Name (optional)"
              placeholderTextColor={colors.textTertiary}
              value={addName}
              onChangeText={setAddName}
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => { setAddAdminModalVisible(false); setAddEmail(''); setAddName(''); }}
                variant="outline"
                style={styles.modalBtn}
              />
              <Button
                title="Add"
                onPress={handleAddAdminSubmit}
                loading={addLoading}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  errorCard: { margin: spacing.md },
  errorText: { ...typography.body, color: colors.error },
  sectionTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.md },
  card: { marginBottom: spacing.md },
  clinicName: { ...typography.h3, marginBottom: spacing.sm },
  profileRow: { flexDirection: 'row', marginBottom: spacing.xs },
  label: { ...typography.caption, color: colors.textTertiary, width: 80 },
  value: { ...typography.body, color: colors.text, flex: 1 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  statusChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusChipText: { ...typography.body, color: colors.text },
  statusChipTextActive: { ...typography.body, color: colors.textInverse },
  smallCard: { marginBottom: spacing.sm },
  therapistName: { ...typography.body, fontWeight: '600' },
  caption: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  emptyText: { ...typography.body, color: colors.textTertiary, marginBottom: spacing.md },
  addAdminBtn: { alignSelf: 'flex-start', marginBottom: spacing.sm },
  adminRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  adminInfo: { flex: 1, minWidth: 0 },
  adminName: { ...typography.body, fontWeight: '600' },
  removeBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  removeBtnText: { ...typography.caption, color: colors.error, fontWeight: '600' },
  inviteLabel: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.sm, marginBottom: spacing.xs },
  inviteExpiry: { ...typography.caption, color: colors.primary, marginTop: 2 },
  tapHint: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.xs, fontSize: 12 },
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
  modalTitle: { ...typography.h3, marginBottom: spacing.sm },
  modalHint: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalBtn: { flex: 1 },
});
