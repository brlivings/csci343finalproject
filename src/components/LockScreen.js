// Shown on launch when the biometric lock setting is on.
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import PrimaryButton from './PrimaryButton';
import { COLORS, FONTS, GRADIENTS, SIZES } from '../constants/theme';

export default function LockScreen({ onUnlock }) {
  const [error, setError] = useState(null);

  const authenticate = useCallback(async () => {
    try {
      const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Biohacker' });
      if (res.success) onUnlock();
      else setError('Authentication was cancelled.');
    } catch {
      // No biometric hardware (e.g. web): don't lock the user out.
      onUnlock();
    }
  }, [onUnlock]);

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  return (
    <LinearGradient colors={GRADIENTS.splash} style={styles.wrap}>
      <MaterialCommunityIcons name="shield-lock" size={80} color={COLORS.white} />
      <Text style={styles.title}>Biohacker is locked</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton title="Unlock" icon="fingerprint" variant="outline" onPress={authenticate} style={{ marginTop: 24, minWidth: 200 }} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontFamily: FONTS.bold, fontSize: SIZES.h2, color: COLORS.white, marginTop: 16 },
  error: { fontFamily: FONTS.regular, color: COLORS.sky, marginTop: 8 },
});
