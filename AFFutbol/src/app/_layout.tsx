import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-splash';
import { NavigationDarkTheme, NavigationLightTheme } from '@/constants/navigation-theme';
import { AuthProvider } from '@/features/auth/auth-context';
import { NotificationBridge } from '@/features/notifications/notification-bridge';
import { queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={isDark ? NavigationDarkTheme : NavigationLightTheme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <AnimatedSplashOverlay />
          <NotificationBridge />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="match/[id]" />
            <Stack.Screen name="article/[id]" />
            <Stack.Screen name="statistics" />
            <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
            <Stack.Screen name="auth-callback" />
            <Stack.Screen name="reset-password" options={{ presentation: 'modal' }} />
            <Stack.Screen name="edit-profile" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
