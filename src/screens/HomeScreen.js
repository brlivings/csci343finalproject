import React, { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GradientHeader from '../components/GradientHeader';
import CompoundCard from '../components/CompoundCard';
import { COLORS, FONTS, GRADIENTS, LINKS, SHADOW, SIZES } from '../constants/theme';
import { COMPOUNDS, getCompound } from '../data/compounds';
import { levelProgress } from '../data/gym';
import { isSameDay, useBiohacker } from '../context/BiohackerContext';
import useResponsive from '../hooks/useResponsive';

const QUICK_LINKS = [
  { label: 'Library', icon: 'file-tree', route: 'Library' },
  { label: 'Quizzes', icon: 'school', route: 'Quizzes' },
  { label: 'My Gym', icon: 'office-building', route: 'Gym' },
  { label: 'Journal', icon: 'notebook', route: 'Journal' },
  { label: 'Settings', icon: 'cog', route: 'Settings' },
];

export default function HomeScreen({ navigation }) {
  const { state, logDose } = useBiohacker();
  const { contentWidth, isLandscape, columns } = useResponsive();
  const { level, current, needed, pct } = levelProgress(state.progress.xp);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Compound of the day — stable for the whole day.
  const featured = useMemo(() => {
    const d = new Date();
    const dayIndex = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate();
    return COMPOUNDS[dayIndex % COMPOUNDS.length];
  }, []);

  const todayLogs = useMemo(() => state.logs.filter((l) => isSameDay(l.takenAt)), [state.logs]);
  const takenToday = useMemo(() => new Set(todayLogs.map((l) => l.compoundId)), [todayLogs]);
  const stackDone = state.stack.filter((s) => takenToday.has(s.compoundId)).length;

  const go = (route) => navigation.navigate(route);

  return (
    <View style={styles.screen}>
      <GradientHeader
        title={`${greeting}${state.profile.name ? `, ${state.profile.name}` : ''}`}
        subtitle="Biohacker · your legal-only optimization lab"
        right={
          <View style={styles.coinPill}>
            <MaterialCommunityIcons name="cash-multiple" size={18} color={COLORS.primaryDark} />
            <Text style={styles.coinText}>${state.progress.coins}</Text>
          </View>
        }
      />
      <ScrollView contentContainerStyle={[styles.content, { width: contentWidth }]}>
        {/* Level card */}
        <Pressable onPress={() => go('Quizzes')}>
          <LinearGradient colors={GRADIENTS.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.levelCard, SHADOW]}>
            <View style={styles.levelRow}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelNum}>{level}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.levelTitle}>Biohacker Level {level}</Text>
                <Text style={styles.levelSub}>
                  {current}/{needed} XP to level {level + 1} · take quizzes to grow your gym
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` }]} />
                </View>
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Quick links */}
        <View style={styles.quickRow}>
          {QUICK_LINKS.map((q) => (
            <Pressable key={q.route} onPress={() => go(q.route)} style={({ pressed }) => [styles.quick, pressed && { opacity: 0.8 }]}>
              <View style={styles.quickIcon}>
                <MaterialCommunityIcons name={q.icon} size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.quickLabel} numberOfLines={1}>
                {q.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.split, (isLandscape || columns > 1) && { flexDirection: 'row' }]}>
          {/* Today's stack */}
          <View style={[styles.section, (isLandscape || columns > 1) && { flex: 1, marginRight: 8 }]}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Today&apos;s stack</Text>
              <Text style={styles.sectionMeta}>
                {stackDone}/{state.stack.length} taken
              </Text>
            </View>
            {state.stack.length === 0 ? (
              <Pressable style={styles.emptyCard} onPress={() => go('Library')}>
                <MaterialCommunityIcons name="plus-circle-outline" size={22} color={COLORS.primary} />
                <Text style={styles.emptyText}>Browse the library to build your stack</Text>
              </Pressable>
            ) : (
              state.stack.map((item) => {
                const c = getCompound(item.compoundId);
                if (!c) return null;
                const done = takenToday.has(item.compoundId);
                return (
                  <View key={item.id} style={styles.stackRow}>
                    <Pressable
                      onPress={() => !done && logDose({ compoundId: c.id, dose: item.dose, unit: item.unit, slot: item.slot, note: '' })}
                      hitSlop={8}
                      accessibilityLabel={done ? `${c.name} taken` : `Mark ${c.name} as taken`}
                    >
                      <MaterialCommunityIcons
                        name={done ? 'check-circle' : 'checkbox-blank-circle-outline'}
                        size={26}
                        color={done ? COLORS.success : COLORS.primary}
                      />
                    </Pressable>
                    <Text style={[styles.stackName, done && styles.done]} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={styles.stackDose}>
                      {item.dose} {item.unit}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          {/* Featured */}
          <View style={[styles.section, (isLandscape || columns > 1) && { flex: 1, marginLeft: 8 }]}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Compound of the day</Text>
            </View>
            <CompoundCard compound={featured} onPress={() => navigation.navigate('CompoundDetail', { id: featured.id })} />
          </View>
        </View>

        <Pressable onPress={() => Linking.openURL(LINKS.sourceTree)} style={styles.sourceLink}>
          <MaterialCommunityIcons name="open-in-new" size={16} color={COLORS.primary} />
          <Text style={styles.sourceText}>Based on the Max Pharma compound tree (legal OTC compounds only)</Text>
        </Pressable>
        <Text style={styles.disclaimer}>
          Educational use only. Not medical advice. Talk to a healthcare professional before starting any supplement.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding, paddingBottom: 40, alignSelf: 'center' },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  coinText: { fontFamily: FONTS.semiBold, color: COLORS.primaryDark },
  levelCard: { borderRadius: SIZES.radiusLg, padding: 16 },
  levelRow: { flexDirection: 'row', alignItems: 'center' },
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  levelNum: { fontFamily: FONTS.bold, fontSize: SIZES.h2, color: COLORS.primary },
  levelTitle: { fontFamily: FONTS.semiBold, fontSize: SIZES.h3, color: COLORS.white },
  levelSub: { fontFamily: FONTS.regular, fontSize: SIZES.tiny, color: COLORS.sky },
  barTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: COLORS.white, borderRadius: 4 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  quick: { alignItems: 'center', flex: 1 },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW,
  },
  quickLabel: { fontFamily: FONTS.medium, fontSize: SIZES.tiny, color: COLORS.text, marginTop: 6 },
  split: { marginTop: 8 },
  section: { marginTop: 16 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontFamily: FONTS.semiBold, fontSize: SIZES.h3, color: COLORS.text },
  sectionMeta: { fontFamily: FONTS.medium, fontSize: SIZES.small, color: COLORS.primary },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: SIZES.radius,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primaryLight,
    backgroundColor: COLORS.white,
  },
  emptyText: { fontFamily: FONTS.medium, color: COLORS.primary, flex: 1 },
  stackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  stackName: { flex: 1, fontFamily: FONTS.medium, color: COLORS.text },
  done: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  stackDose: { fontFamily: FONTS.regular, color: COLORS.textMuted, fontSize: SIZES.small },
  sourceLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 24 },
  sourceText: { fontFamily: FONTS.medium, color: COLORS.primary, fontSize: SIZES.small, flex: 1 },
  disclaimer: { fontFamily: FONTS.regular, color: COLORS.textMuted, fontSize: SIZES.tiny, marginTop: 8 },
});
