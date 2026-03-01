import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { listAdminClinics } from '../../api/admin';
import type { AdminStackParamList } from '../../types/navigation';
import type { Clinic } from '../../types/therapist';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminClinics'>;

function ClinicCard({ item }: { item: Clinic }) {
  return (
    <Card style={styles.card}>
      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
      {(item.country || item.location) && (
        <Text style={styles.meta} numberOfLines={1}>
          {[item.location, item.country].filter(Boolean).join(' · ')}
        </Text>
      )}
      {item.description ? (
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
      ) : null}
    </Card>
  );
}

export function AdminClinicsScreen() {
  const navigation = useNavigation<Nav>();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { clinics: list } = await listAdminClinics();
      setClinics(list);
    } catch {
      setClinics([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  return (
    <ScreenLayout scroll={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Clinics</Text>
        <Text style={styles.subtitle}>
          Add clinics so therapists can choose them when applying. Parents see clinics in the directory.
        </Text>
        <Button
          title="Add clinic"
          onPress={() => navigation.navigate('AdminClinicForm')}
          style={styles.addBtn}
        />
      </View>

      {loading && clinics.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={clinics}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ClinicCard item={item} />}
          style={styles.listContainer}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No clinics yet"
              message='Tap "Add clinic" to create one. Therapists can then affiliate with clinics.'
            />
          }
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: spacing.md },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  addBtn: { alignSelf: 'flex-start' },
  listContainer: { flex: 1 },
  list: { paddingTop: 12 },
  card: { marginBottom: spacing.md },
  name: { ...typography.h3, marginBottom: spacing.xs },
  meta: { ...typography.bodySmall, color: colors.textSecondary },
  desc: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
