import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-splash';
import { NavigationDarkTheme, NavigationLightTheme } from '@/constants/navigation-theme';
import { queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={isDark ? NavigationDarkTheme : NavigationLightTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="match/[id]" />
          <Stack.Screen name="article/[id]" />
          <Stack.Screen name="statistics" />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
