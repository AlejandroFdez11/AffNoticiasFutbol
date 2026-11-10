import { Linking, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { LegalDocument } from '../documents';

/**
 * Renders the structured copy of `documents.ts`. Headings, paragraphs, bullet
 * lists and external links are enough for every legal page; a Markdown parser
 * would add weight and a dependency for no real gain.
 */
export function LegalDocumentView({ document }: { document: LegalDocument }) {
  const theme = useTheme();

  return (
    <View style={styles.document}>
      {document.blocks.map((block, index) => {
        switch (block.kind) {
          case 'heading':
            return (
              <ThemedText key={index} type="smallBold" style={styles.heading}>
                {block.text}
              </ThemedText>
            );
          case 'paragraph':
            return (
              <ThemedText key={index} type="small" themeColor="textSecondary">
                {block.text}
              </ThemedText>
            );
          case 'bullets':
            return (
              <View key={index} style={styles.bullets}>
                {block.items.map((item) => (
                  <View key={item} style={styles.bulletRow}>
                    <ThemedText type="small" style={{ color: theme.brand }}>
                      •
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.bulletText}>
                      {item}
                    </ThemedText>
                  </View>
                ))}
              </View>
            );
          case 'link':
            return (
              <ThemedText
                key={index}
                type="small"
                accessibilityRole="link"
                style={[styles.link, { color: theme.brand }]}
                onPress={() => void Linking.openURL(block.url)}>
                {block.label} ↗
              </ThemedText>
            );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  document: {
    gap: Spacing.two,
  },
  heading: {
    paddingTop: Spacing.three,
  },
  bullets: {
    gap: Spacing.one,
    paddingLeft: Spacing.one,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  bulletText: {
    flex: 1,
  },
  link: {
    textDecorationLine: 'underline',
  },
});
