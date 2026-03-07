import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { HeroHeader } from '../../components/ui/HeroHeader';
import { Card } from '../../components/ui/Card';
import type { ParentStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, layout, typography } from '../../theme';

const CONTENT_INSET = 20;
const TAB_PADDING_BOTTOM = 100;

export function ContentLibraryScreen() {
  const navigation = useNavigation();
  const parentStack = navigation.getParent<NativeStackNavigationProp<ParentStackParamList>>();

  return (
    <ScreenLayout edgeToEdge>
      <View style={styles.sectionBlock}>
        <HeroHeader
          title="Library"
          subtitle="Articles, videos, and activities for you and your child."
          overline="Content"
        />
      </View>
      <View style={[styles.sectionBlock, styles.cardsSection]}>
        <TouchableOpacity
          onPress={() => parentStack?.navigate('ParentResources')}
          activeOpacity={0.7}
        >
          <Card variant="glass" style={styles.card}>
            <Text style={styles.cardTitle}>Parent resources</Text>
            <Text style={styles.cardDesc}>Articles and videos on parenting and emotional support.</Text>
          </Card>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => parentStack?.navigate('KidsActivities')}
          activeOpacity={0.7}
        >
          <Card variant="glass" style={styles.card}>
            <Text style={styles.cardTitle}>Kids activities</Text>
            <Text style={styles.cardDesc}>Age-appropriate activities to build emotional skills together.</Text>
          </Card>
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  sectionBlock: { paddingHorizontal: CONTENT_INSET, marginBottom: layout.sectionGap },
  cardsSection: { paddingBottom: TAB_PADDING_BOTTOM },
  card: { marginBottom: spacing.md },
  cardTitle: { ...typography.CardTitle, color: colors.textPrimary },
  cardDesc: { ...typography.Caption, color: colors.textSecondary, marginTop: spacing.xs },
});
