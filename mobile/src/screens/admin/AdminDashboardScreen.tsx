import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { getDashboard, type AdminDashboard } from '../../api/admin';
import type { AdminStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminMain'>;

function DashboardCard({
  title,
  count,
  onPress,
  accent,
}: {
  title: string;
  count: number;
  onPress: () => void;
  accent?: 'primary' | 'warning' | 'success';
}) {
  const bg = accent === 'warning' ? colors.warningMuted : accent === 'success' ? colors.successMuted : colors.surface;
  const borderColor = accent === 'warning' ? colors.warning : accent === 'success' ? colors.success : colors.border;
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Card style={[styles.dashboardCard, { backgroundColor: bg, borderColor }]}>
        <Text style={styles.cardCount}>{count}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
      </Card>
    </TouchableOpacity>
  );
}

export function AdminDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await getDashboard();
      setData(res);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load dashboard');
      setData(null);
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <ScreenLayout scroll={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard…</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout scroll>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.title}>Admin overview</Text>
        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : null}
        {data ? (
          <>
            <View style={styles.cardGrid}>
              <DashboardCard
                title="Pending therapist applications"
                count={data.pending_therapist_applications}
                onPress={() => navigation.navigate('TherapistApplications')}
                accent={data.pending_therapist_applications > 0 ? 'warning' : undefined}
              />
              <DashboardCard
                title="Pending clinic applications"
                count={data.pending_clinic_applications}
                onPress={() => navigation.navigate('AdminClinicApplications')}
                accent={data.pending_clinic_applications > 0 ? 'warning' : undefined}
              />
              <DashboardCard
                title="Reports pending review"
                count={data.reports_pending_review}
                onPress={() => navigation.navigate('AdminReports')}
                accent={data.reports_pending_review > 0 ? 'warning' : undefined}
              />
              <DashboardCard
                title="Verified therapists"
                count={data.verified_therapists_count}
                onPress={() => navigation.navigate('TherapistApplications')}
                accent="success"
              />
              <DashboardCard
                title="Verified clinics"
                count={data.verified_clinics_count}
                onPress={() => navigation.navigate('AdminClinics')}
                accent="success"
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('AdminContent')}
              >
                <Card style={[styles.dashboardCard, { borderWidth: 1, borderColor: colors.border }]}>
                  <Text style={styles.cardTitle}>Content (articles, videos, activities)</Text>
                  <Text style={styles.cardSubtitle}>Manage and publish library content</Text>
                </Card>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  title: { ...typography.h2, marginBottom: spacing.lg, color: colors.text },
  cardGrid: {},
  dashboardCard: {
    marginBottom: spacing.md,
    borderWidth: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  cardCount: { ...typography.h1, color: colors.text, marginBottom: spacing.xs },
  cardTitle: { ...typography.body, color: colors.textSecondary },
  cardSubtitle: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.xs },
  errorCard: { marginBottom: spacing.md },
  errorText: { ...typography.body, color: colors.error },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  loadingText: { ...typography.subtitle, marginTop: spacing.md },
});
