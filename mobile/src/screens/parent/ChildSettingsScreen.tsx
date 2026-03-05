import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { ParentStackParamList } from '../../types/navigation';
import { useChildren } from '../../hooks/useChildren';
import {
  getChildGamificationSettings,
  setChildGamificationSettings,
  resetChildStickers,
  type ChildGamificationSettings,
} from '../../utils/childGamificationSettingsStorage';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { HeaderBar } from '../../components/layout/HeaderBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Route = RouteProp<ParentStackParamList, 'ChildSettings'>;

export function ChildSettingsScreen() {
  const { params } = useRoute<Route>();
  const childId = params?.childId ?? '';
  const { children } = useChildren();
  const child = children.find((c) => c.id === childId);
  const childName = child?.name ?? 'Child';

  const [settings, setSettingsState] = useState<ChildGamificationSettings>({
    dailyQuestEnabled: true,
    stickersEnabled: true,
    reducedMotion: false,
  });

  const loadSettings = useCallback(async () => {
    if (!childId) return;
    try {
      const s = await getChildGamificationSettings(childId);
      setSettingsState(s);
    } catch {
      setSettingsState({ dailyQuestEnabled: true, stickersEnabled: true, reducedMotion: false });
    }
  }, [childId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const update = useCallback(
    async (partial: Partial<ChildGamificationSettings>) => {
      if (!childId) return;
      const next = { ...settings, ...partial };
      setSettingsState(next);
      await setChildGamificationSettings(childId, partial);
    },
    [childId, settings]
  );

  const handleResetStickers = useCallback(() => {
    if (!childId) return;
    Alert.alert(
      'Reset sticker book',
      'This will clear all stickers for this child and allow a new sticker to be earned today. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetChildStickers(childId);
              Alert.alert('Sticker book reset.');
            } catch {
              Alert.alert('Error', 'Could not reset sticker book. Try again.');
            }
          },
        },
      ]
    );
  }, [childId]);

  return (
    <ScreenLayout>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <HeaderBar title={`${childName} settings`} />

        <Card title="Daily practice" style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelWrap}>
              <Text style={styles.toggleLabel}>Daily Quest</Text>
              <Text style={styles.caption}>Shows a daily suggested practice in Child mode.</Text>
            </View>
            <Switch
              value={settings.dailyQuestEnabled}
              onValueChange={(v) => update({ dailyQuestEnabled: v })}
              trackColor={{ false: colors.border, true: colors.primaryMuted }}
              thumbColor={settings.dailyQuestEnabled ? colors.primary : colors.textMuted}
            />
          </View>
        </Card>

        <Card title="Rewards" style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelWrap}>
              <Text style={styles.toggleLabel}>Stickers</Text>
              <Text style={styles.caption}>Collect stickers after completing the daily quest.</Text>
            </View>
            <Switch
              value={settings.stickersEnabled}
              onValueChange={(v) => update({ stickersEnabled: v })}
              trackColor={{ false: colors.border, true: colors.primaryMuted }}
              thumbColor={settings.stickersEnabled ? colors.primary : colors.textMuted}
            />
          </View>
          <Button
            title="Reset sticker book"
            onPress={handleResetStickers}
            variant="danger"
            size="small"
            style={styles.resetBtn}
          />
        </Card>

        <Card title="Accessibility" style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelWrap}>
              <Text style={styles.toggleLabel}>Reduced motion</Text>
              <Text style={styles.caption}>Fewer animations in Child mode.</Text>
            </View>
            <Switch
              value={settings.reducedMotion}
              onValueChange={(v) => update({ reducedMotion: v })}
              trackColor={{ false: colors.border, true: colors.primaryMuted }}
              thumbColor={settings.reducedMotion ? colors.primary : colors.textMuted}
            />
          </View>
        </Card>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl },
  card: { marginBottom: spacing.lg },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  toggleLabelWrap: { flex: 1, marginRight: spacing.md },
  toggleLabel: { ...typography.body, fontWeight: '600', color: colors.text },
  caption: { ...typography.Caption, color: colors.textSecondary, marginTop: spacing.xs },
  resetBtn: { marginTop: spacing.sm },
});
