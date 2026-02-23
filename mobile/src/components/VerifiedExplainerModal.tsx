import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, typography } from '../theme';

const EXPLAINER_TEXT = `"Verified" means Mindful Kids has reviewed this professional's submitted credentials (e.g. professional license, issuing country, specialization). It is not an endorsement of their practice or outcomes. Always use your own judgment when choosing care.`;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function VerifiedExplainerModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <TouchableOpacity style={styles.box} activeOpacity={1} onPress={() => {}}>
          <Text style={styles.title}>What does Verified mean?</Text>
          <Text style={styles.body}>{EXPLAINER_TEXT}</Text>
          <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  box: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    maxWidth: 360,
    width: '100%',
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  buttonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
  },
});
