
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, router, useSegments } from 'expo-router';
import 'react-native-reanimated';
import { useNetworkState } from 'expo-network';
import { useFonts } from 'expo-font';
import { useColorScheme } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { colors } from '@/styles/commonStyles';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Custom dark theme matching our color scheme
const BioHackerTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    notification: colors.alert,
  },
};

function RootLayoutNav() {
  const { user, isLoading, hasSeenDisclaimer, hasCompletedOnboarding } = useApp();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoading) {
      // Handle initial routing based on app state
      if (!hasSeenDisclaimer || !hasCompletedOnboarding || !user) {
        // User needs to complete onboarding
        if (segments[0] !== 'onboarding') {
          router.replace('/onboarding');
        }
      } else {
        // User is authenticated, go to main app
        if (segments[0] !== '(tabs)') {
          router.replace('/(tabs)/(home)/dashboard');
        }
      }
    }
  }, [user, isLoading, hasSeenDisclaimer, hasCompletedOnboarding, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="disclaimer-view" 
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Disclaimer',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const networkState = useNetworkState();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <ThemeProvider value={BioHackerTheme}>
          <SystemBars style="light" />
          <RootLayoutNav />
          <StatusBar style="light" />
        </ThemeProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
