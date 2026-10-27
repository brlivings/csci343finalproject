import React, { useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import EmptyState from '../components/EmptyState';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { getCompound } from '../data/compounds';
import { isSameDay, useBiohacker } from '../context/BiohackerContext';
import useResponsive from '../hooks/useResponsive';

const dayLabel = (iso) => {
  const d = new Date(iso);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(iso)) return 'Today';
  if (isSameDay(iso, yesterday)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

export default function JournalScreen() {
  const { state, deleteLog } = useBiohacker();
  const { contentWidth, isLandscape } = useResponsive();

  // Flatten logs into day headers + entries for a single FlatList.
  const rows = useMemo(() => {
    const out = [];
    let lastDay = null;
    state.logs.forEach((log) => {
      const label = dayLabel(log.takenAt);
      if (label !== lastDay) {
        out.push({ type: 'header', id: `h-${label}`, label });
        lastDay = label;
      }
      out.push({ type: 'log', id: log.id, log });
    });
    return out;
  }, [state.logs]);

  const stats = useMemo(() => {
    const days = new Set(state.logs.map((l) => new Date(l.takenAt).toDateString()));
    const counts = {};
    state.logs.forEach((l) => {
      counts[l.compoundId] = (counts[l.compoundId] || 0) + 1;
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return {
      total: state.logs.length,
      days: days.size,
      top: top ? getCompound(top[0])?.name : '—',
    };
  }, [state.logs]);

  const confirmDelete = (log) =>
    Alert.alert('Delete entry?', 'This journal entry will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteLog(log.id) },
    ]);

  return (
    <View style={styles.screen}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        style={{ alignSelf: 'center', width: contentWidth }}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={[styles.stats, isLandscape && { maxWidth: 600, alignSelf: 'center' }]}>
            <Stat icon="pill" value={stats.total} label="Doses logged" />
            <Stat icon="calendar-check" value={stats.days} label="Active days" />
            <Stat icon="trophy-outline" value={stats.top} label="Most taken" small />
          </View>
        }
        ListEmptyComponent={
          <EmptyState icon="notebook-outline" title="No entries yet" message="Log a dose from any compound or check items off your daily stack." />
        }
        renderItem={({ item }) => {
          if (item.type === 'header') return <Text style={styles.day}>{item.label}</Text>;
          const { log } = item;
          const c = getCompound(log.compoundId);
          return (
            <View style={styles.entry}>
              <View style={styles.dot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{c?.name || log.compoundId}</Text>
                <Text style={styles.meta}>
                  {log.dose} {log.unit} ·{' '}
                  {new Date(log.takenAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </Text>
                {log.note ? <Text style={styles.note}>“{log.note}”</Text> : null}
              </View>
              <Pressable onPress={() => confirmDelete(log)} hitSlop={10} accessibilityLabel="Delete entry">
                <MaterialCommunityIcons name="delete-outline" size={22} color={COLORS.textMuted} />
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}

function Stat({ icon, value, label, small }) {
  return (
    <View style={styles.stat}>
      <MaterialCommunityIcons name={icon} size={22} color={COLORS.primary} />
      <Text style={[styles.statValue, small && { fontSize: SIZES.small }]} numberOfLines={2}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SIZES.padding, paddingBottom: 40 },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stat: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { fontFamily: FONTS.bold, fontSize: SIZES.h3, color: COLORS.text, textAlign: 'center', marginTop: 4 },
  statLabel: { fontFamily: FONTS.regular, fontSize: SIZES.tiny, color: COLORS.textMuted, textAlign: 'center' },
  day: { fontFamily: FONTS.semiBold, color: COLORS.primary, fontSize: SIZES.body, marginTop: 12, marginBottom: 6 },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primaryLight },
  name: { fontFamily: FONTS.semiBold, color: COLORS.text },
  meta: { fontFamily: FONTS.regular, color: COLORS.textMuted, fontSize: SIZES.small },
  note: { fontFamily: FONTS.light, color: COLORS.text, fontSize: SIZES.small, marginTop: 2, fontStyle: 'italic' },
});
