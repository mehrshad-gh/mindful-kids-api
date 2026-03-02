import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { Card } from '../../components/ui/Card';
import type { ParentStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme';

export function ContentLibraryScreen() {
  const navigation = useNavigation();
  const parentStack = navigation.getParent<NativeStackNavigationProp<ParentStackParamList>>();

  return (
    <ScreenLayout>
      <Text style={styles.title}>Library</Text>
      <Text style={styles.subtitle}>Articles, videos, and activities for you and your child.</Text>
      <TouchableOpacity
        onPress={() => parentStack?.navigate('ParentResources')}
        activeOpacity={0.7}
      >
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Parent resources</Text>
          <Text style={styles.cardDesc}>Articles and videos on parenting and emotional support.</Text>
        </Card>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => parentStack?.navigate('KidsActivities')}
        activeOpacity={0.7}
      >
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Kids activities</Text>
          <Text style={styles.cardDesc}>Age-appropriate activities to build emotional skills together.</Text>
        </Card>
      </TouchableOpacity>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  card: { marginBottom: spacing.md },
  cardTitle: { ...typography.body, fontWeight: '600', color: colors.text },
  cardDesc: { ...typography.subtitle, color: colors.textSecondary, marginTop: spacing.xs },
});
