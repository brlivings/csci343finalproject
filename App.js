import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { BiohackerProvider, useBiohacker } from './src/context/BiohackerContext';
import AppNavigator from './src/navigation/AppNavigator';
import LockScreen from './src/components/LockScreen';
import { COLORS } from './src/constants/theme';

// Keep the native splash screen up until fonts and saved data are loaded.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 600, fade: true });

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.white,
    text: COLORS.text,
    border: COLORS.border,
  },
};

function Root() {
  const { hydrated, state } = useBiohacker();
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [unlocked, setUnlocked] = useState(false);
  const ready = fontsLoaded && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  const unlock = useCallback(() => setUnlocked(true), []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: COLORS.primaryDark }} />;

  if (state.settings.biometricLock && !unlocked) {
    return (
      <>
        <StatusBar style="light" />
        <LockScreen onUnlock={unlock} />
      </>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <BiohackerProvider>
        <Root />
      </BiohackerProvider>
    </SafeAreaProvider>
  );
}
