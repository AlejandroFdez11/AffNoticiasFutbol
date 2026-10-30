import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.backgroundElement}
      indicatorColor={colors.backgroundSelected}
      tintColor={colors.brand}
      labelStyle={{ selected: { color: colors.brand } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Partidos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'sportscourt', selected: 'sportscourt.fill' }}
          md="sports_soccer"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="news">
        <NativeTabs.Trigger.Label>Noticias</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'newspaper', selected: 'newspaper.fill' }}
          md="newspaper"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="predictions">
        <NativeTabs.Trigger.Label>Predicciones</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'target', selected: 'target' }} md="target" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="rankings">
        <NativeTabs.Trigger.Label>Ranking</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'trophy', selected: 'trophy.fill' }} md="emoji_events" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
