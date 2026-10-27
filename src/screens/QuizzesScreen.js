import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GradientHeader from '../components/GradientHeader';
import { COLORS, FONTS, SHADOW, SIZES } from '../constants/theme';
import { QUIZZES } from '../data/quizzes';
import { GRADE_COLORS, gradeFor, levelProgress } from '../data/gym';
import { useBiohacker } from '../context/BiohackerContext';
import useResponsive from '../hooks/useResponsive';

const DIFFICULTY_COLORS = { Beginner: '#42A5F5', Intermediate: '#1E88E5', Advanced: '#1565C0', Expert: '#0D47A1' };

export default function QuizzesScreen({ navigation }) {
  const { state } = useBiohacker();
  const { columns, contentWidth } = useResponsive();
  const { level, current, needed, pct } = levelProgress(state.progress.xp);

  const completed = useMemo(() => Object.keys(state.progress.best).length, [state.progress.best]);
  const average = useMemo(() => {
    const vals = Object.values(state.progress.best);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  }, [state.progress.best]);

  const gap = 12;
  const cardWidth = (contentWidth - SIZES.padding * 2 - gap * (columns - 1)) / columns;

  return (
    <View style={styles.screen}>
      <GradientHeader title="Quizzes" subtitle="Better grades = more XP & cash for your gym">
        <View style={styles.statsRow}>
          <HeaderStat label="Level" value={level} />
          <HeaderStat label="Completed" value={`${completed}/${QUIZZES.length}`} />
          <HeaderStat label="Avg grade" value={average === null ? '—' : gradeFor(average)} />
          <HeaderStat label="Cash" value={`$${state.progress.coins}`} />
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.round(pct * 100)}%` }]} />
        </View>
        <Text style={styles.barLabel}>
          {current}/{needed} XP to level {level + 1}
        </Text>
      </GradientHeader>

      <FlatList
        key={`q-${columns}`}
        data={QUIZZES}
        numColumns={columns}
        keyExtractor={(q) => q.id}
        style={{ alignSelf: 'center', width: contentWidth }}
        contentContainerStyle={styles.list}
        columnWrapperStyle={columns > 1 ? { gap } : undefined}
        renderItem={({ item }) => {
          const best = state.progress.best[item.id];
          const grade = best !== undefined ? gradeFor(best) : null;
          return (
            <Pressable
              onPress={() => navigation.navigate('QuizPlay', { quizId: item.id })}
              style={({ pressed }) => [styles.card, SHADOW, { width: cardWidth, opacity: pressed ? 0.9 : 1 }]}
              accessibilityLabel={`Start ${item.title} quiz`}
            >
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name={item.icon} size={26} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.desc} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.metaRow}>
                  <View style={[styles.diff, { backgroundColor: DIFFICULTY_COLORS[item.difficulty] }]}>
                    <Text style={styles.diffText}>{item.difficulty}</Text>
                  </View>
                  <Text style={styles.meta}>{item.questions.length} questions</Text>
                </View>
              </View>
              {grade ? (
                <View style={[styles.grade, { borderColor: GRADE_COLORS[grade] }]}>
                  <Text style={[styles.gradeText, { color: GRADE_COLORS[grade] }]}>{grade}</Text>
                  <Text style={styles.gradePct}>{best}%</Text>
                </View>
              ) : (
                <MaterialCommunityIcons name="play-circle" size={36} color={COLORS.primary} />
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function HeaderStat({ label, value }) {
  return (
    <View style={styles.hStat}>
      <Text style={styles.hValue}>{value}</Text>
      <Text style={styles.hLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  statsRow: { flexDirection: 'row', marginTop: 14 },
  hStat: { flex: 1, alignItems: 'center' },
  hValue: { fontFamily: FONTS.bold, fontSize: SIZES.h3, color: COLORS.white },
  hLabel: { fontFamily: FONTS.regular, fontSize: SIZES.tiny, color: COLORS.skyDark },
  barTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, marginTop: 12, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: COLORS.white },
  barLabel: { fontFamily: FONTS.regular, fontSize: SIZES.tiny, color: COLORS.sky, marginTop: 4, textAlign: 'right' },
  list: { padding: SIZES.padding, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconWrap: { width: 50, height: 50, borderRadius: 14, backgroundColor: COLORS.sky, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FONTS.semiBold, fontSize: SIZES.body + 1, color: COLORS.text },
  desc: { fontFamily: FONTS.regular, fontSize: SIZES.small, color: COLORS.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  diff: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  diffText: { fontFamily: FONTS.medium, fontSize: SIZES.tiny, color: COLORS.white },
  meta: { fontFamily: FONTS.regular, fontSize: SIZES.tiny, color: COLORS.textMuted },
  grade: { width: 54, height: 54, borderRadius: 27, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  gradeText: { fontFamily: FONTS.bold, fontSize: SIZES.h3, lineHeight: 22 },
  gradePct: { fontFamily: FONTS.regular, fontSize: 9, color: COLORS.textMuted },
});
