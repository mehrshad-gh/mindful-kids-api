import React, { useCallback, useState } from 'react';
import axios from 'axios';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { listTherapists, addTherapist, removeTherapist, type ClinicTherapist } from '../../api/clinicAdmin';
import type { ClinicStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { layout } from '../../theme';

type Nav = NativeStackNavigationProp<ClinicStackParamList, 'ClinicTherapists'>;
type Route = RouteProp<ClinicStackParamList, 'ClinicTherapists'>;

export function ClinicTherapistsScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { clinicId } = route.params;
  const [therapists, setTherapists] = useState<ClinicTherapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addEmail, setAddEmail] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const { therapists: list } = await listTherapists(clinicId);
      setTherapists(list);
    } catch {
      setTherapists([]);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const handleAdd = async () => {
    const email = addEmail.trim();
    if (!email) {
      Alert.alert('Required', 'Enter the therapist\'s email address.');
      return;
    }
    setAdding(true);
    try {
      const { therapist } = await addTherapist(clinicId, email);
      setTherapists((prev) => [therapist, ...prev]);
      setAddEmail('');
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) && e.response?.data
        ? (e.response.data as { error?: string }).error
        : null;
      Alert.alert('Error', msg || 'Could not add therapist. They must be a verified therapist with an account.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = (therapist: ClinicTherapist) => {
    Alert.alert(
      'Remove therapist',
      `Remove ${therapist.name} from this clinic? They will no longer be listed under this clinic.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemovingId(therapist.id);
            try {
              await removeTherapist(clinicId, therapist.id);
              setTherapists((prev) => prev.filter((t) => t.id !== therapist.id));
            } catch {
              Alert.alert('Error', 'Could not remove therapist.');
            } finally {
              setRemovingId(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ClinicTherapist }) => (
    <Card style={styles.card} variant="outlined">
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          {item.specialty ? (
            <Text style={styles.specialty}>{item.specialty}</Text>
          ) : null}
          {item.avg_rating != null && !Number.isNaN(item.avg_rating) && (
            <Text style={styles.rating}>
              ★ {item.avg_rating.toFixed(1)}
              {item.review_count != null && item.review_count > 0
                ? ` (${item.review_count} reviews)`
                : ''}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => handleRemove(item)}
          disabled={removingId === item.id}
          style={styles.removeBtn}
        >
          {removingId === item.id ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <Text style={styles.removeText}>Remove</Text>
          )}
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading && therapists.length === 0) {
    return (
      <ScreenLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout scroll={false}>
      {therapists.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Card style={styles.addCard} variant="outlined">
            <Text style={styles.addLabel}>Add therapist by email</Text>
            <Text style={styles.addHint}>Therapist must be verified and have an account.</Text>
            <TextInput
              style={styles.emailInput}
              value={addEmail}
              onChangeText={setAddEmail}
              placeholder="therapist@example.com"
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button
              title="Add"
              onPress={handleAdd}
              loading={adding}
              size="small"
              variant="outline"
            />
          </Card>
          <EmptyState
            title="No therapists"
            message="Add a verified therapist by their email above."
          />
        </View>
      ) : (
        <FlatList
          data={therapists}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <Card style={styles.addCard} variant="outlined">
                <Text style={styles.addLabel}>Add therapist by email</Text>
                <Text style={styles.addHint}>Therapist must be verified and have an account.</Text>
                <TextInput
                  style={styles.emailInput}
                  value={addEmail}
                  onChangeText={setAddEmail}
                  placeholder="therapist@example.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Button
                  title="Add"
                  onPress={handleAdd}
                  loading={adding}
                  size="small"
                  variant="outline"
                />
              </Card>
              <Text style={styles.header}>
                Therapists at this clinic. Remove below to unlink from the directory.
              </Text>
            </>
          }
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: { padding: layout.screenPadding, paddingBottom: spacing.xxl },
  addCard: { marginBottom: layout.sectionGapSmall },
  addLabel: { ...typography.label, marginBottom: spacing.xs },
  addHint: { ...typography.subtitle, color: colors.textTertiary, marginBottom: spacing.sm },
  emailInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  header: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginBottom: layout.sectionGapSmall,
  },
  card: { marginBottom: layout.listItemGap },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { flex: 1 },
  name: { ...typography.h4, marginBottom: spacing.xs },
  specialty: { ...typography.subtitle, color: colors.textSecondary, marginBottom: spacing.xs },
  rating: { ...typography.subtitle, color: colors.textTertiary },
  removeBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  removeText: { ...typography.label, color: colors.error },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
