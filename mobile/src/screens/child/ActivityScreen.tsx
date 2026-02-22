import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import { CompleteActivityBlock } from '../../components/CompleteActivityBlock';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { ChildTabParamList } from '../../types/navigation';

const authToken: string | null = null; // TODO: from real auth

type Props = {
  navigation: NativeStackNavigationProp<ChildTabParamList, 'Activity'>;
  route: RouteProp<ChildTabParamList, 'Activity'>;
};

export function ActivityScreen({ route }: Props) {
  const activityId = route.params?.activityId;
  const { selectedChildId } = useAuth();

  return (
    <ScreenLayout>
      <Text style={styles.title}>Activity</Text>
      {activityId ? (
        <>
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Activity</Text>
            <Text style={styles.cardDesc}>
              When you finish, rate how it went and save your stars below.
            </Text>
          </Card>
          <CompleteActivityBlock
            activityId={activityId}
            activityTitle="Rate & complete"
            childId={selectedChildId}
            token={authToken}
          />
        </>
      ) : (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Do an activity</Text>
          <Text style={styles.cardDesc}>
            Open an activity from the Activity Hub, then come here to rate it and earn stars.
          </Text>
        </Card>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  card: { marginBottom: spacing.md },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  cardDesc: { color: colors.textSecondary, marginTop: spacing.xs },
});
