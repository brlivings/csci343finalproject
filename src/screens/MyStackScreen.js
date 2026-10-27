import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GradientHeader from '../components/GradientHeader';
import DoseModal, { SLOTS } from '../components/DoseModal';
import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS, FONTS, SHADOW, SIZES } from '../constants/theme';
import { getCompound } from '../data/compounds';
import { useBiohacker } from '../context/BiohackerContext';
import useResponsive from '../hooks/useResponsive';

export default function MyStackScreen({ navigation }) {
  const { state, updateStackItem, removeFromStack, logDose } = useBiohacker();
  const { contentWidth } = useResponsive();
  const [editing, setEditing] = useState(null);

  // Group stack items by time slot for display.
  const sections = useMemo(
    () =>
      SLOTS.map((slot) => ({
        ...slot,
        items: state.stack.filter((s) => s.slot === slot.id),
      })).filter((s) => s.items.length > 0),
    [state.stack]
  );

  const confirmRemove = (item, name) =>
    Alert.alert('Remove from stack?', `${name} will be removed from your daily stack.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromStack(item.id) },
    ]);

  const logSlot = (slot) => {
    slot.items.forEach((item) =>
      logDose({ compoundId: item.compoundId, dose: item.dose, unit: item.unit, slot: item.slot, note: '' })
    );
    Alert.alert('Logged!', `${slot.items.length} item(s) from your ${slot.label.toLowerCase()} stack were logged.`);
  };

  const editingCompound = editing && getCompound(editing.compoundId);

  return (
    <View style={styles.screen}>
      <GradientHeader title="My Stack" subtitle={`${state.stack.length} compounds in your daily routine`} />
      <FlatList
        data={sections}
        keyExtractor={(s) => s.id}
        style={{ alignSelf: 'center', width: contentWidth }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState icon="layers-outline" title="Your stack is empty" message="Find compounds in the library and add them to build your routine.">
            <PrimaryButton title="Open library" icon="file-tree" onPress={() => navigation.navigate('Library')} />
          </EmptyState>
        }
        renderItem={({ item: slot }) => (
          <View style={styles.slot}>
            <View style={styles.slotHead}>
              <MaterialCommunityIcons name={slot.icon} size={20} color={COLORS.primary} />
              <Text style={styles.slotTitle}>{slot.label}</Text>
              <Pressable onPress={() => logSlot(slot)} style={styles.logAll}>
                <MaterialCommunityIcons name="check-all" size={16} color={COLORS.white} />
                <Text style={styles.logAllText}>Log all</Text>
              </Pressable>
            </View>
            {slot.items.map((item) => {
              const c = getCompound(item.compoundId);
              if (!c) return null;
              return (
                <View key={item.id} style={[styles.card, SHADOW]}>
                  <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('CompoundDetail', { id: c.id })}>
                    <Text style={styles.name}>{c.name}</Text>
                    <Text style={styles.dose}>
                      {item.dose} {item.unit}
                      {item.dose > c.dose.max ? '  ·  above typical range' : ''}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => setEditing(item)} hitSlop={8} style={styles.iconBtn} accessibilityLabel={`Edit ${c.name}`}>
                    <MaterialCommunityIcons name="pencil" size={20} color={COLORS.primary} />
                  </Pressable>
                  <Pressable onPress={() => confirmRemove(item, c.name)} hitSlop={8} style={styles.iconBtn} accessibilityLabel={`Remove ${c.name}`}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.danger} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      />
      <DoseModal
        visible={!!editing}
        compound={editingCompound}
        initial={editing}
        mode="stack"
        onClose={() => setEditing(null)}
        onSubmit={({ dose, slot }) => {
          updateStackItem(editing.id, { dose, slot });
          setEditing(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SIZES.padding, paddingBottom: 40 },
  slot: { marginBottom: 18 },
  slotHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  slotTitle: { flex: 1, fontFamily: FONTS.semiBold, fontSize: SIZES.h3, color: COLORS.text },
  logAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  logAllText: { fontFamily: FONTS.medium, color: COLORS.white, fontSize: SIZES.small },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  name: { fontFamily: FONTS.semiBold, color: COLORS.text, fontSize: SIZES.body },
  dose: { fontFamily: FONTS.regular, color: COLORS.textMuted, fontSize: SIZES.small },
  iconBtn: { padding: 8 },
});
