import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, RefreshControl, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useChildren } from '../../hooks/useChildren';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { ParentTabParamList } from '../../types/navigation';
import type { ParentStackParamList } from '../../types/navigation';

type TabNav = NativeStackNavigationProp<ParentTabParamList, 'Dashboard'>;

export function DashboardScreen() {
  const navigation = useNavigation<TabNav>();
  const { user, setAppRole, selectedChildId, setSelectedChild } = useAuth();
  const { children, loading, error, refresh } = useChildren();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const parentStack = navigation.getParent<NativeStackNavigationProp<ParentStackParamList>>();

  const handleUseAsChild = () => {
    if (!selectedChildId) {
      Alert.alert('Select a child', 'Choose a child below to use the app as them. Add one if needed.');
      return;
    }
    setAppRole('child');
  };

  const handleAddChild = () => {
    parentStack?.navigate('AddChild');
  };

  return (
    <ScreenLayout scroll={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.parentAccent} />}
      >
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Hello, {user?.name ?? 'Parent'}!</Text>

        <Text style={styles.sectionTitle}>Child for “Child mode”</Text>
        {loading && children.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color={colors.parentAccent} />
          </View>
        ) : error ? (
          <Card style={styles.card}>
            <Text style={styles.errorText}>{error.message}</Text>
            <Button title="Retry" onPress={refresh} variant="outline" style={styles.retryBtn} />
          </Card>
        ) : children.length === 0 ? (
          <Card style={styles.card}>
            <Text style={styles.hint}>Add a child so they can use the app and you can track progress.</Text>
            <Button title="Add child" onPress={handleAddChild} style={styles.addBtn} />
          </Card>
        ) : (
          <>
            {selectedChild && (
              <Card style={[styles.card, styles.selectedCard]}>
                <Text style={styles.selectedLabel}>Selected for Child mode</Text>
                <Text style={styles.selectedName}>{selectedChild.name}</Text>
              </Card>
            )}
            {children.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedChild(c.id)}
                activeOpacity={0.8}
              >
                <Card style={[styles.card, selectedChildId === c.id && styles.cardSelected]}>
                  <Text style={styles.childName}>{c.name}</Text>
                  {c.age_group ? <Text style={styles.childMeta}>{c.age_group}</Text> : null}
                </Card>
              </TouchableOpacity>
            ))}
            <Button title="Add another child" onPress={handleAddChild} variant="ghost" style={styles.addAnother} />
          </>
        )}

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Quick actions</Text>
          <Text style={styles.cardDesc}>View advice, library, and child progress in the tabs.</Text>
        </Card>

        <Button
          title="Use app as Child"
          onPress={handleUseAsChild}
          variant="outline"
          style={styles.switchBtn}
        />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  card: { marginBottom: spacing.md },
  cardSelected: { borderColor: colors.parentAccent, borderWidth: 2 },
  selectedCard: { backgroundColor: colors.surface },
  selectedLabel: { fontSize: 12, color: colors.textSecondary },
  selectedName: { fontSize: 18, fontWeight: '700', color: colors.primary },
  childName: { fontSize: 16, fontWeight: '600', color: colors.text },
  childMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  cardDesc: { color: colors.textSecondary, marginTop: spacing.xs },
  hint: { color: colors.textSecondary, marginBottom: spacing.sm },
  errorText: { color: colors.error, marginBottom: spacing.sm },
  retryBtn: { alignSelf: 'flex-start' },
  addBtn: { marginTop: spacing.sm },
  addAnother: { marginBottom: spacing.md },
  switchBtn: { marginTop: spacing.md },
  centered: { padding: spacing.md },
});
