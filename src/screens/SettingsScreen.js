import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS, FONTS, LINKS, SIZES } from '../constants/theme';
import { useBiohacker } from '../context/BiohackerContext';
import useResponsive from '../hooks/useResponsive';

export default function SettingsScreen() {
  const { state, setName, setSetting, resetAll } = useBiohacker();
  const { contentWidth } = useResponsive();
  const [name, setNameInput] = useState(state.profile.name);
  const [nameError, setNameError] = useState(null);
  const [bioAvailable, setBioAvailable] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const hw = await LocalAuthentication.hasHardwareAsync();
        const enrolled = hw && (await LocalAuthentication.isEnrolledAsync());
        setBioAvailable(!!enrolled);
      } catch {
        setBioAvailable(false);
      }
    })();
  }, []);

  const saveName = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) return setNameError('Name must be at least 2 characters.');
    if (trimmed.length > 20) return setNameError('Name must be 20 characters or fewer.');
    if (!/^[A-Za-z][A-Za-z '-]*$/.test(trimmed)) return setNameError('Letters, spaces, hyphens and apostrophes only.');
    setNameError(null);
    setName(trimmed);
    return Alert.alert('Saved', `Nice to meet you, ${trimmed}!`);
  };

  const toggleBiometric = async (value) => {
    if (!value) return setSetting('biometricLock', false);
    if (!bioAvailable) {
      return Alert.alert('Not available', 'This device has no Face ID / fingerprint enrolled.');
    }
    const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Enable Biohacker lock' });
    if (res.success) setSetting('biometricLock', true);
    return undefined;
  };

  const confirmReset = () =>
    Alert.alert('Reset everything?', 'This erases your stack, journal, quiz progress and gym. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetAll },
    ]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { width: contentWidth }]} keyboardShouldPersistTaps="handled">
      <Text style={styles.section}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Display name</Text>
        <View style={styles.nameRow}>
          <TextInput
            value={name}
            onChangeText={(t) => {
              setNameInput(t);
              setNameError(null);
            }}
            placeholder="Your name"
            placeholderTextColor={COLORS.textMuted}
            style={[styles.input, nameError && { borderColor: COLORS.danger }]}
            maxLength={24}
            autoCapitalize="words"
            accessibilityLabel="Display name"
          />
          <PrimaryButton title="Save" onPress={saveName} />
        </View>
        {nameError ? <Text style={styles.error}>{nameError}</Text> : null}
      </View>

      <Text style={styles.section}>Preferences</Text>
      <View style={styles.card}>
        <SwitchRow icon="vibrate" title="Haptic feedback" subtitle="Vibrate on logs, quiz answers and purchases" value={state.settings.haptics} onChange={(v) => setSetting('haptics', v)} />
        <SwitchRow icon="fingerprint" title="Biometric lock" subtitle={bioAvailable ? 'Require Face ID / fingerprint to open' : 'Not available on this device'} value={state.settings.biometricLock} onChange={toggleBiometric} />
        <SwitchRow icon="alert-circle-outline" title="Show cautions" subtitle="Display safety notes on compound pages" value={state.settings.showCautions} onChange={(v) => setSetting('showCautions', v)} />
        <SwitchRow icon="view-agenda-outline" title="Compact library cards" subtitle="Hide summaries for a denser list" value={state.settings.compactCards} onChange={(v) => setSetting('compactCards', v)} last />
      </View>

      <Text style={styles.section}>About</Text>
      <View style={styles.card}>
        <Text style={styles.about}>
          Biohacker includes only compounds that are legal to buy over the counter as dietary supplements in the US. It is
          organized like the Max Pharma compound tree. Steroids, SARMs, research peptides and prescription drugs are excluded.
          Educational use only; not medical advice.
        </Text>
        <LinkRow label="Max Pharma compound tree" onPress={() => Linking.openURL(LINKS.sourceTree)} />
        <LinkRow label="FDA: dietary supplement safety" onPress={() => Linking.openURL(LINKS.fdaSupplements)} />
      </View>

      <PrimaryButton title="Reset all data" icon="delete-forever" variant="outline" onPress={confirmReset} style={{ marginTop: 20 }} />
      <Text style={styles.version}>Biohacker v1.0.0</Text>
    </ScrollView>
  );
}

function SwitchRow({ icon, title, subtitle, value, onChange, last }) {
  return (
    <View style={[styles.switchRow, !last && styles.divider]}>
      <MaterialCommunityIcons name={icon} size={22} color={COLORS.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.switchTitle}>{title}</Text>
        <Text style={styles.switchSub}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
        thumbColor={value ? COLORS.primary : COLORS.white}
        accessibilityLabel={title}
      />
    </View>
  );
}

function LinkRow({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.link} accessibilityRole="link">
      <Text style={styles.linkText}>{label}</Text>
      <MaterialCommunityIcons name="open-in-new" size={16} color={COLORS.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding, paddingBottom: 40, alignSelf: 'center' },
  section: { fontFamily: FONTS.semiBold, color: COLORS.primary, fontSize: SIZES.small, textTransform: 'uppercase', marginTop: 16, marginBottom: 6 },
  card: { backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  label: { fontFamily: FONTS.medium, color: COLORS.text, marginBottom: 6 },
  nameRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: { flex: 1, minWidth: 0, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: SIZES.radius, paddingHorizontal: 12, paddingVertical: 10, fontFamily: FONTS.regular, color: COLORS.text, backgroundColor: COLORS.background },
  error: { fontFamily: FONTS.regular, color: COLORS.danger, fontSize: SIZES.small, marginTop: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  switchTitle: { fontFamily: FONTS.medium, color: COLORS.text },
  switchSub: { fontFamily: FONTS.regular, color: COLORS.textMuted, fontSize: SIZES.tiny },
  about: { fontFamily: FONTS.regular, color: COLORS.text, fontSize: SIZES.small, lineHeight: 20 },
  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, marginTop: 4 },
  linkText: { fontFamily: FONTS.medium, color: COLORS.primary },
  version: { fontFamily: FONTS.regular, color: COLORS.textMuted, fontSize: SIZES.tiny, textAlign: 'center', marginTop: 16 },
});
