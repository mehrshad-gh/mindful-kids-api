import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { listClinics } from '../../api/clinics';
import type { Clinic } from '../../types/therapist';
import type { ParentStackParamList, ParentTabParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type TabNav = NativeStackNavigationProp<ParentTabParamList, 'Clinics'>;

function ClinicCard({ item, onPress }: { item: Clinic; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={styles.card}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        {(item.location || item.address || item.country) && (
          <Text style={styles.location} numberOfLines={1}>
            📍 {[item.location, item.address, item.country].filter(Boolean).join(' · ')}
          </Text>
        )}
        {item.description ? (
          <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
        ) : null}
      </Card>
    </TouchableOpacity>
  );
}

export function ClinicDirectoryScreen() {
  const navigation = useNavigation<TabNav>();
  const parentStack = navigation.getParent<NativeStackNavigationProp<ParentStackParamList>>();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { clinics: list } = await listClinics({ limit: 100 });
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

  const openClinic = (clinicId: string) => {
    parentStack?.navigate('ClinicDetail', { clinicId });
  };

  if (loading && clinics.length === 0) {
    return (
      <ScreenLayout scroll={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.parentAccent} />
          <Text style={styles.loadingText}>Loading clinics…</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout scroll={false}>
      <Text style={styles.title}>Clinics</Text>
      <Text style={styles.subtitle}>Browse clinics and their therapists.</Text>
      <FlatList
        data={clinics}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ClinicCard item={item} onPress={() => openClinic(item.id)} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.parentAccent]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No clinics in the directory yet.</Text>
          </View>
        }
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, marginBottom: spacing.xs, paddingHorizontal: spacing.md },
  subtitle: { ...typography.subtitle, marginBottom: spacing.md, paddingHorizontal: spacing.md },
  list: { padding: spacing.md, paddingTop: 0 },
  card: { marginBottom: spacing.md },
  name: { ...typography.h3, marginBottom: spacing.xs },
  location: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs },
  desc: { ...typography.bodySmall, color: colors.text },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.textSecondary },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.textSecondary },
});
