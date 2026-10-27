// Modal used to add a compound to the stack or log a dose.
// Includes TextInput validation and an Alert confirmation for high doses.
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import useResponsive from '../hooks/useResponsive';
import PrimaryButton from './PrimaryButton';

export const SLOTS = [
  { id: 'morning', label: 'Morning', icon: 'weather-sunny' },
  { id: 'preworkout', label: 'Pre-workout', icon: 'run-fast' },
  { id: 'evening', label: 'Evening', icon: 'weather-night' },
];

const NOTE_LIMIT = 140;

export function validateDose(text) {
  const trimmed = text.trim();
  if (!trimmed) return 'Enter a dose.';
  if (!/^\d*\.?\d+$/.test(trimmed)) return 'Use numbers only (e.g. 200 or 2.5).';
  const value = parseFloat(trimmed);
  if (value <= 0) return 'Dose must be greater than zero.';
  if (value > 100000) return 'That number is unrealistically large.';
  return null;
}

export default function DoseModal({ visible, compound, mode = 'stack', initial, onClose, onSubmit }) {
  const { width, isLandscape } = useResponsive();
  const [dose, setDose] = useState('');
  const [slot, setSlot] = useState('morning');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);

  // Reset the form each time the modal opens.
  useEffect(() => {
    if (visible && compound) {
      setDose(String(initial?.dose ?? compound.dose.min));
      setSlot(initial?.slot ?? 'morning');
      setNote('');
      setError(null);
      setTouched(false);
    }
  }, [visible, compound, initial]);

  if (!compound) return null;

  const onChangeDose = (text) => {
    setDose(text);
    if (touched) setError(validateDose(text));
  };

  const submit = () => {
    setTouched(true);
    const err = validateDose(dose);
    setError(err);
    if (err) return;
    if (note.length > NOTE_LIMIT) return;

    const value = parseFloat(dose);
    const payload = { compoundId: compound.id, dose: value, unit: compound.dose.unit, slot, note: note.trim() };

    if (value > compound.dose.max) {
      Alert.alert(
        'Above typical range',
        `${value} ${compound.dose.unit} is above the common range of ${compound.dose.min}–${compound.dose.max} ${compound.dose.unit}. Continue anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', style: 'destructive', onPress: () => onSubmit(payload) },
        ]
      );
    } else {
      onSubmit(payload);
    }
  };

  const sheetWidth = Math.min(width, isLandscape ? 560 : 520);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { width: sheetWidth }]}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20 }}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>
                {mode === 'stack' ? (initial ? 'Edit stack item' : 'Add to My Stack') : 'Log a dose'}
              </Text>
              <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
              </Pressable>
            </View>
            <Text style={styles.compound}>{compound.name}</Text>
            <Text style={styles.range}>
              Typical range: {compound.dose.min}–{compound.dose.max} {compound.dose.unit}
            </Text>

            <Text style={styles.label}>Dose ({compound.dose.unit})</Text>
            <View style={[styles.inputRow, error && styles.inputError]}>
              <TextInput
                value={dose}
                onChangeText={onChangeDose}
                onBlur={() => {
                  setTouched(true);
                  setError(validateDose(dose));
                }}
                keyboardType="decimal-pad"
                placeholder={`e.g. ${compound.dose.min}`}
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                maxLength={8}
                accessibilityLabel="Dose amount"
              />
              <Text style={styles.unit}>{compound.dose.unit}</Text>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.label}>{mode === 'stack' ? 'When do you take it?' : 'Time of day'}</Text>
            <View style={styles.slots}>
              {SLOTS.map((s) => {
                const active = slot === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setSlot(s.id)}
                    style={[styles.slot, active && styles.slotActive]}
                    accessibilityState={{ selected: active }}
                  >
                    <MaterialCommunityIcons name={s.icon} size={18} color={active ? COLORS.white : COLORS.primary} />
                    <Text style={[styles.slotText, active && { color: COLORS.white }]}>{s.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {mode === 'log' ? (
              <>
                <Text style={styles.label}>Note (optional)</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="How do you feel?"
                  placeholderTextColor={COLORS.textMuted}
                  style={[styles.noteInput, note.length > NOTE_LIMIT && styles.inputError]}
                  multiline
                  accessibilityLabel="Note"
                />
                <Text style={[styles.counter, note.length > NOTE_LIMIT && { color: COLORS.danger }]}>
                  {note.length}/{NOTE_LIMIT}
                </Text>
              </>
            ) : null}

            <PrimaryButton
              title={mode === 'stack' ? (initial ? 'Save changes' : 'Add to stack') : 'Log dose'}
              icon={mode === 'stack' ? 'plus-circle-outline' : 'check-circle-outline'}
              onPress={submit}
              style={{ marginTop: 20 }}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusLg,
    borderTopRightRadius: SIZES.radiusLg,
    maxHeight: '90%',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: FONTS.bold, fontSize: SIZES.h3, color: COLORS.text },
  compound: { fontFamily: FONTS.semiBold, fontSize: SIZES.body, color: COLORS.primary, marginTop: 8 },
  range: { fontFamily: FONTS.regular, fontSize: SIZES.small, color: COLORS.textMuted },
  label: { fontFamily: FONTS.medium, fontSize: SIZES.small, color: COLORS.text, marginTop: 16, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: 14,
    backgroundColor: COLORS.background,
  },
  input: { flex: 1, minWidth: 0, fontFamily: FONTS.medium, fontSize: SIZES.h3, color: COLORS.text, paddingVertical: 10 },
  unit: { fontFamily: FONTS.medium, color: COLORS.textMuted },
  inputError: { borderColor: COLORS.danger },
  error: { fontFamily: FONTS.regular, color: COLORS.danger, fontSize: SIZES.small, marginTop: 4 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  slotActive: { backgroundColor: COLORS.primary },
  slotText: { fontFamily: FONTS.medium, fontSize: SIZES.small, color: COLORS.primary },
  noteInput: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    padding: 12,
    minHeight: 70,
    textAlignVertical: 'top',
    fontFamily: FONTS.regular,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  counter: { alignSelf: 'flex-end', fontFamily: FONTS.regular, fontSize: SIZES.tiny, color: COLORS.textMuted, marginTop: 4 },
});
