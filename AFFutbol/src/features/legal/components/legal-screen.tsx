import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/icon-button';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_LAST_UPDATED,
  getLegalDocument,
  legalPublicUrl,
  type LegalDocumentId,
} from '../documents';
import { LegalDocumentView } from './legal-document-view';
import { LegalLinks } from './legal-links';

/**
 * Shared shell for `/legal/privacidad`, `/legal/terminos` and `/legal/fuentes`.
 * The same screen runs on the web build, which is where the public URLs that
 * App Store Connect asks for come from.
 */
export function LegalScreen({ documentId }: { documentId: LegalDocumentId }) {
  const theme = useTheme();
  const router = useRouter();
  const document = getLegalDocument(documentId);

  const close = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    // Deep link (public legal URL on web): there is no history to go back to.
    router.replace('/');
  };

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.topBar}>
        <View />
        <IconButton
          icon={{ ios: 'xmark', android: 'close', web: 'close' }}
          label="Cerrar"
          tone="textSecondary"
          onPress={close}
        />
      </View>

      <ScreenHeader eyebrow={document.eyebrow} title={document.title} subtitle={document.summary} />

      <LegalDocumentView document={document} />

      <View
        style={[
          styles.meta,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <ThemedText type="small" themeColor="textSecondary">
          Última actualización: {LEGAL_LAST_UPDATED}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Contacto: {LEGAL_CONTACT_EMAIL}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Versión web: {legalPublicUrl(document.id)}
        </ThemedText>
      </View>

      <LegalLinks exclude={document.id} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: Spacing.four,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radii.medium,
    borderWidth: 1,
  },
});
