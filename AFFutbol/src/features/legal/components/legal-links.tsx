import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import {
  LEGAL_DOCUMENT_IDS,
  LEGAL_PUBLIC_PATHS,
  getLegalDocument,
  type LegalDocumentId,
} from '../documents';

type LegalLinksProps = {
  /** Hides the document the user is already reading. */
  exclude?: LegalDocumentId;
};

/** Rows for Perfil → Legal and for the footer of every legal page. */
export function LegalLinks({ exclude }: LegalLinksProps) {
  const theme = useTheme();
  const router = useRouter();
  const documents = LEGAL_DOCUMENT_IDS.filter((id) => id !== exclude).map(getLegalDocument);

  return (
    <View style={styles.list}>
      {documents.map((document) => (
        <Pressable
          key={document.id}
          accessibilityRole="link"
          accessibilityLabel={document.title}
          onPress={() => router.push(LEGAL_PUBLIC_PATHS[document.id])}
          style={({ pressed }) => [
            styles.row,
            { borderColor: theme.border },
            pressed && styles.pressed,
          ]}>
          <View style={styles.text}>
            <ThemedText type="smallBold">{document.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
              {document.summary}
            </ThemedText>
          </View>
          <ThemedText themeColor="textSecondary">›</ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderTopWidth: 1,
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
  pressed: {
    opacity: 0.7,
  },
});
