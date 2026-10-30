import type { Href } from 'expo-router';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { forwardRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Brand, MaxContentWidth, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { BrandMark } from './brand-mark';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

const TABS: { name: string; href: Href; label: string }[] = [
  { name: 'index', href: '/', label: 'Partidos' },
  { name: 'news', href: '/news', label: 'Noticias' },
  { name: 'predictions', href: '/predictions', label: 'Predicciones' },
  { name: 'rankings', href: '/rankings', label: 'Ranking' },
  { name: 'profile', href: '/profile', label: 'Perfil' },
];

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <CustomTabList>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton>{tab.label}</TabButton>
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = Omit<TabTriggerSlotProps, 'ref'>;

const TabButton = forwardRef<ComponentRef<typeof View>, TabButtonProps>(function TabButton(
  { children, isFocused, ...props },
  ref
) {
  return (
    <Pressable {...props} ref={ref} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButton}>
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
});

function CustomTabList(props: TabListProps) {
  const theme = useTheme();

  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView
        style={[styles.innerContainer, { borderColor: theme.border }]}
        type="backgroundElement">
        <View style={styles.brand}>
          <BrandMark size={28} />
          <ThemedText type="smallBold">{Brand.name}</ThemedText>
        </View>

        <View style={styles.tabs}>{props.children}</View>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    height: '100%',
  },
  tabListContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.large,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginRight: 'auto',
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.pill,
  },
});
