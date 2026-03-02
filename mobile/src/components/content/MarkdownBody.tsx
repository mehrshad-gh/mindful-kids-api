import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme';

type Block =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'numbered'; num: number; text: string };

/**
 * Parse markdown-ish body into blocks for readable rendering:
 * ## Headings, bullet lists (- *), numbered steps (1. 2.), paragraphs.
 */
function parseMarkdown(md: string | null): Block[] {
  if (!md || !md.trim()) return [];
  const blocks: Block[] = [];
  const lines = md.split(/\r?\n/);
  let i = 0;
  const numberedRegex = /^(\d+)\.\s+(.+)$/;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      i++;
      continue;
    }
    // Heading
    if (trimmed.startsWith('## ')) {
      blocks.push({ kind: 'heading', text: trimmed.slice(3).trim() });
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      blocks.push({ kind: 'heading', text: trimmed.slice(2).trim() });
      i++;
      continue;
    }
    // Bullet
    if (/^[-*]\s+/.test(trimmed) || /^\s*[-*]\s+/.test(trimmed)) {
      const text = trimmed.replace(/^\s*[-*]\s+/, '');
      blocks.push({ kind: 'bullet', text });
      i++;
      continue;
    }
    // Numbered step
    const numMatch = trimmed.match(numberedRegex);
    if (numMatch) {
      blocks.push({ kind: 'numbered', num: parseInt(numMatch[1], 10), text: numMatch[2].trim() });
      i++;
      continue;
    }
    // Paragraph (including bold strip)
    const para = trimmed.replace(/\*\*(.+?)\*\*/g, '$1');
    blocks.push({ kind: 'paragraph', text: para });
    i++;
  }
  return blocks;
}

interface MarkdownBodyProps {
  markdown: string | null;
  /** Optional style overrides */
  style?: { container?: object; paragraph?: object; bullet?: object; numbered?: object; heading?: object };
}

export function MarkdownBody({ markdown, style: customStyle = {} }: MarkdownBodyProps) {
  const blocks = parseMarkdown(markdown);
  if (blocks.length === 0) return null;

  return (
    <View style={[styles.container, customStyle.container]}>
      {blocks.map((block, idx) => {
        if (block.kind === 'heading') {
          return (
            <Text
              key={idx}
              style={[
                styles.heading,
                idx > 0 && styles.headingNotFirst,
                customStyle.heading,
              ]}
            >
              {block.text}
            </Text>
          );
        }
        if (block.kind === 'paragraph') {
          return (
            <Text key={idx} style={[styles.paragraph, customStyle.paragraph]}>
              {block.text}
            </Text>
          );
        }
        if (block.kind === 'bullet') {
          return (
            <View key={idx} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={[styles.bulletText, customStyle.bullet]}>{block.text}</Text>
            </View>
          );
        }
        if (block.kind === 'numbered') {
          return (
            <View key={idx} style={styles.numberedRow}>
              <Text style={styles.numberedNum}>{block.num}.</Text>
              <Text style={[styles.numberedText, customStyle.numbered]}>{block.text}</Text>
            </View>
          );
        }
        return null;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  heading: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headingNotFirst: { marginTop: spacing.md },
  paragraph: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    paddingLeft: spacing.xs,
  },
  bulletDot: {
    ...typography.body,
    color: colors.text,
    marginRight: spacing.sm,
    lineHeight: 24,
  },
  bulletText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    lineHeight: 24,
  },
  numberedRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
  },
  numberedNum: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginRight: spacing.sm,
    minWidth: 20,
    lineHeight: 24,
  },
  numberedText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    lineHeight: 24,
  },
});
