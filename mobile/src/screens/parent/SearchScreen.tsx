import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { searchTherapists, searchClinics } from '../../api/search';
import type {
  SearchTherapistItem,
  SearchClinicItem,
} from '../../api/search';
import type { ParentStackParamList, ParentTabParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type TabNav = NativeStackNavigationProp<ParentTabParamList, 'Search'>;

type TabKind = 'therapists' | 'clinics';

function TherapistResultCard({
  item,
  onPress,
}: {
  item: SearchTherapistItem;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          </View>
          <View style={styles.cardMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
              {item.verified_status === 'verified' ? (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Verified</Text>
                </View>
              ) : null}
            </View>
            {item.specialty ? (
              <Text style={styles.specialty} numberOfLines={1}>{item.specialty}</Text>
            ) : null}
            {item.country ? (
              <Text style={styles.meta}>📍 {item.country}</Text>
            ) : null}
            {item.clinic_names.length > 0 ? (
              <Text style={styles.clinics} numberOfLines={1}>
                {item.clinic_names.join(', ')}
              </Text>
            ) : null}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function ClinicResultCard({
  item,
  onPress,
}: {
  item: SearchClinicItem;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.nameRow}>
          <Text style={styles.clinicName} numberOfLines={1}>{item.name}</Text>
          {item.verification_status === 'verified' ? (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified</Text>
            </View>
          ) : null}
        </View>
        {item.country ? (
          <Text style={styles.meta}>📍 {item.country}</Text>
        ) : null}
        <Text style={styles.therapistCount}>
          {item.therapist_count} therapist{item.therapist_count !== 1 ? 's' : ''}
        </Text>
      </Card>
    </TouchableOpacity>
  );
}

export function SearchScreen() {
  const navigation = useNavigation<TabNav>();
  const parentStack = navigation.getParent<NativeStackNavigationProp<ParentStackParamList>>();
  const [tab, setTab] = useState<TabKind>('therapists');
  const [country, setCountry] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [clinicId, setClinicId] = useState('');
  const [therapists, setTherapists] = useState<SearchTherapistItem[]>([]);
  const [clinics, setClinics] = useState<SearchClinicItem[]>([]);
  const [clinicOptions, setClinicOptions] = useState<SearchClinicItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClinicOptions = useCallback(async () => {
    setLoadingClinics(true);
    try {
      const res = await searchClinics({ limit: 100, verified_only: true });
      setClinicOptions(res.clinics ?? []);
    } catch {
      setClinicOptions([]);
    } finally {
      setLoadingClinics(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClinicOptions();
    }, [loadClinicOptions])
  );

  const loadTherapists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchTherapists({
        country: country.trim() || undefined,
        verified_only: verifiedOnly,
        clinic_id: clinicId || undefined,
        limit: 50,
      });
      setTherapists(res.therapists ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load therapists');
      setTherapists([]);
    } finally {
      setLoading(false);
    }
  }, [country, verifiedOnly, clinicId]);

  const loadClinics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchClinics({
        country: country.trim() || undefined,
        verified_only: verifiedOnly,
        limit: 50,
      });
      setClinics(res.clinics ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load clinics');
      setClinics([]);
    } finally {
      setLoading(false);
    }
  }, [country, verifiedOnly]);

  const runSearch = useCallback(() => {
    if (tab === 'therapists') loadTherapists();
    else loadClinics();
  }, [tab, loadTherapists, loadClinics]);

  useEffect(() => {
    runSearch();
  }, [tab]);

  const openTherapist = (psychologistId: string) => {
    parentStack?.navigate('PsychologistDetail', { psychologistId });
  };

  const openClinic = (clinicId: string) => {
    parentStack?.navigate('ClinicDetail', { clinicId });
  };

  return (
    <ScreenLayout scroll={false}>
      <Text style={styles.title}>Discover</Text>
      <Text style={styles.subtitle}>Find verified therapists and clinics worldwide.</Text>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'therapists' && styles.tabActive]}
          onPress={() => setTab('therapists')}
        >
          <Text style={[styles.tabText, tab === 'therapists' && styles.tabTextActive]}>
            Therapists
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'clinics' && styles.tabActive]}
          onPress={() => setTab('clinics')}
        >
          <Text style={[styles.tabText, tab === 'clinics' && styles.tabTextActive]}>
            Clinics
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <Text style={styles.filterLabel}>Country (optional)</Text>
        <Input
          value={country}
          onChangeText={setCountry}
          placeholder="e.g. US, CA, UK"
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Verified only</Text>
          <Switch
            value={verifiedOnly}
            onValueChange={setVerifiedOnly}
            trackColor={{ false: colors.border, true: colors.primary + '80' }}
            thumbColor={verifiedOnly ? colors.primary : colors.textTertiary}
          />
        </View>
        {tab === 'therapists' && (
          <>
            <Text style={styles.filterLabel}>Clinic (optional)</Text>
            <View style={styles.clinicChips}>
              <TouchableOpacity
                style={[styles.chip, !clinicId && styles.chipActive]}
                onPress={() => setClinicId('')}
              >
                <Text style={[styles.chipText, !clinicId && styles.chipTextActive]}>All</Text>
              </TouchableOpacity>
              {loadingClinics ? (
                <ActivityIndicator size="small" color={colors.primary} style={styles.chipLoader} />
              ) : (
                clinicOptions.slice(0, 15).map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, clinicId === c.id && styles.chipActive]}
                    onPress={() => setClinicId(clinicId === c.id ? '' : c.id)}
                  >
                    <Text style={[styles.chipText, clinicId === c.id && styles.chipTextActive]} numberOfLines={1}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}
        <TouchableOpacity style={styles.searchBtn} onPress={runSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      ) : loading && therapists.length === 0 && clinics.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : tab === 'therapists' ? (
        <FlatList
          data={therapists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TherapistResultCard item={item} onPress={() => openTherapist(item.id)} />
          )}
          contentContainerStyle={styles.listContent}
          listEmptyComponent={
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No therapists match your filters. Try changing country or clinic.
              </Text>
            </Card>
          }
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={runSearch} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={clinics}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClinicResultCard item={item} onPress={() => openClinic(item.id)} />
          )}
          contentContainerStyle={styles.listContent}
          listEmptyComponent={
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No clinics match your filters. Try changing country.
              </Text>
            </Card>
          }
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={runSearch} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.subtitle, marginBottom: spacing.md },
  tabRow: { flexDirection: 'row', marginBottom: spacing.md },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  tabText: { ...typography.body, color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  filters: { marginBottom: spacing.lg },
  filterLabel: { ...typography.label, marginBottom: spacing.xs, marginTop: spacing.sm },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  toggleLabel: { ...typography.body, color: colors.text },
  clinicChips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textSecondary },
  chipTextActive: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  chipLoader: { marginLeft: spacing.sm },
  searchBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  searchBtnText: { ...typography.body, fontWeight: '600', color: colors.textInverse },
  listContent: { paddingBottom: spacing.xl },
  card: { marginBottom: spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: { ...typography.h3, color: colors.primary },
  cardMeta: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  cardName: { ...typography.body, fontWeight: '600', flex: 1 },
  verifiedBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  specialty: { ...typography.caption, color: colors.textSecondary },
  meta: { ...typography.caption, marginTop: 2 },
  clinics: { ...typography.caption, marginTop: 2, color: colors.textTertiary },
  clinicName: { ...typography.body, fontWeight: '600', flex: 1 },
  therapistCount: { ...typography.caption, marginTop: spacing.xs },
  errorCard: { marginBottom: spacing.md },
  errorText: { ...typography.body, color: colors.error },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  loadingText: { ...typography.subtitle, marginTop: spacing.md },
  emptyCard: {},
  emptyText: { ...typography.subtitle, textAlign: 'center' },
});
