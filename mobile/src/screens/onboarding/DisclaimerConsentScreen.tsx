import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/ui/Button';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import { setDisclaimerAccepted } from '../../services/onboardingStorage';
import type { OnboardingStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Props = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'DisclaimerConsent'>;
  route: { params?: { next?: 'AddChild' } };
};

export function DisclaimerConsentScreen({ navigation, route }: Props) {
  const next = route.params?.next ?? 'AddChild';
  const [agreeDisclaimer, setAgreeDisclaimer] = useState(false);
  const [agreeConsent, setAgreeConsent] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const canContinue = agreeDisclaimer && agreeConsent && agreePrivacy;

  const handleContinue = async () => {
    if (!canContinue) {
      Alert.alert(
        'Please confirm',
        'Please read and check all three boxes to continue. This confirms you understand the app is for support only and you consent to the data practices.'
      );
      return;
    }
    await setDisclaimerAccepted(true);
    navigation.replace(next);
  };

  const CheckRow = ({
    checked,
    onToggle,
    label,
  }: {
    checked: boolean;
    onToggle: () => void;
    label: string;
  }) => (
    <TouchableOpacity style={styles.checkRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenLayout scroll={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Important information</Text>
        <Text style={styles.intro}>Please read and confirm the following before using Mindful Kids.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional disclaimer</Text>
          <Text style={styles.body}>
            Mindful Kids is <Text style={styles.bold}>not a replacement for professional mental health or medical care</Text>. The app offers activities and tips to support emotional wellbeing. If your child is in crisis, or you have concerns about their mental or physical health, please contact a qualified professional or emergency services.
          </Text>
          <CheckRow
            checked={agreeDisclaimer}
            onToggle={() => setAgreeDisclaimer((v) => !v)}
            label="I understand this app is not a replacement for professional care."
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parental consent</Text>
          <Text style={styles.body}>
            By using this app with a child, you confirm that you are the parent or legal guardian and that you consent to your child using Mindful Kids under your supervision. You understand the app is for supportive use only.
          </Text>
          <CheckRow
            checked={agreeConsent}
            onToggle={() => setAgreeConsent((v) => !v)}
            label="I am the parent or legal guardian and I consent to using this app with my child(ren)."
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data privacy</Text>
          <Text style={styles.body}>
            We collect only what is needed to provide the service: your account details, your child’s profile (e.g. name, age group), and activity progress. Data is stored securely and is not sold to third parties. You can delete your account and data at any time. For full details, see our Privacy Policy (in app or on our website).
          </Text>
          <CheckRow
            checked={agreePrivacy}
            onToggle={() => setAgreePrivacy((v) => !v)}
            label="I have read the data privacy notice and agree to the use of my and my child’s data as described."
          />
        </View>

        <Button
          title="I agree and continue"
          onPress={handleContinue}
          disabled={!canContinue}
          style={styles.button}
        />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.h2, marginBottom: spacing.sm, textAlign: 'center' },
  intro: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg, textAlign: 'center' },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.label, color: colors.primary, marginBottom: spacing.sm },
  body: { ...typography.bodySmall, color: colors.text, marginBottom: spacing.md, lineHeight: 22 },
  bold: { fontWeight: '600' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.sm },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark: { color: colors.surface, fontSize: 14, fontWeight: '700' },
  checkLabel: { ...typography.bodySmall, color: colors.text, flex: 1 },
  button: { marginTop: spacing.lg },
});
