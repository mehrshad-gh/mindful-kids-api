import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { listTherapists, removeTherapist, type ClinicTherapist } from '../../api/clinicAdmin';
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
          <EmptyState
            title="No therapists"
            message="No therapists are currently affiliated with this clinic."
          />
        </View>
      ) : (
        <FlatList
          data={therapists}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.header}>
              Therapists at this clinic can be removed below. They will no longer appear under this
              clinic in the directory.
            </Text>
          }
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: { padding: layout.screenPadding, paddingBottom: spacing.xxl },
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
