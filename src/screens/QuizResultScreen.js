import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS, FONTS, GRADIENTS, SIZES } from '../constants/theme';
import { getQuiz } from '../data/quizzes';
import { EQUIPMENT, FLOORS, GRADE_COLORS, WALLS, levelForXp } from '../data/gym';
import { useBiohacker } from '../context/BiohackerContext';
import useResponsive from '../hooks/useResponsive';

const MESSAGES = {
  A: 'Outstanding! You really know your compounds.',
  B: 'Great job — almost perfect.',
  C: 'Solid work. Review the library to push for an A.',
  D: 'You passed. A little more study will go a long way.',
  F: 'Keep learning! Read up in the library and try again.',
};

export default function QuizResultScreen({ route, navigation }) {
  const { state } = useBiohacker();
  const { contentWidth } = useResponsive();
  const result = state.lastQuizResult;
  const quiz = getQuiz(route.params?.quizId);
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [pop]);

  if (!result || !quiz) return null;

  const prevLevel = levelForXp(route.params?.prevXp ?? 0);
  const newLevel = levelForXp(state.progress.xp);
  const leveledUp = newLevel > prevLevel;
  const unlocked = leveledUp
    ? [
        ...EQUIPMENT.filter((e) => e.level > prevLevel && e.level <= newLevel).map((e) => e.name),
        ...FLOORS.filter((f) => f.level > prevLevel && f.level <= newLevel).map((f) => `${f.name} floor`),
        ...WALLS.filter((w) => w.level > prevLevel && w.level <= newLevel).map((w) => `${w.name} walls`),
      ]
    : [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { width: contentWidth }]}>
      <LinearGradient colors={GRADIENTS.header} style={styles.hero}>
        <Text style={styles.quizTitle}>{quiz.title}</Text>
        <Animated.View style={[styles.gradeCircle, { borderColor: GRADE_COLORS[result.grade], transform: [{ scale: pop }] }]}>
          <Text style={[styles.grade, { color: GRADE_COLORS[result.grade] }]}>{result.grade}</Text>
        </Animated.View>
        <Text style={styles.score}>
          {result.correct}/{result.total} correct · {result.percent}%
        </Text>
        <Text style={styles.message}>{MESSAGES[result.grade]}</Text>
      </LinearGradient>

      <View style={styles.rewards}>
        <Reward icon="cash-multiple" label="Cash earned" value={`+$${result.coins}`} />
        <Reward icon="lightning-bolt" label="XP earned" value={`+${result.xp}`} />
        <Reward icon="star-circle" label="Level" value={newLevel} />
      </View>

      {leveledUp ? (
        <View style={styles.levelUp}>
          <MaterialCommunityIcons name="party-popper" size={28} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.levelUpTitle}>Level up! You reached level {newLevel}</Text>
            <Text style={styles.levelUpText}>
              {unlocked.length ? `Unlocked: ${unlocked.join(', ')}` : 'Your gym floor and customer capacity may have grown.'}
            </Text>
          </View>
        </View>
      ) : null}

      <PrimaryButton title="Spend it in my gym" icon="office-building" onPress={() => navigation.navigate('Tabs', { screen: 'Gym' })} />
      <PrimaryButton
        title="Retake quiz"
        icon="refresh"
        variant="outline"
        onPress={() => navigation.replace('QuizPlay', { quizId: quiz.id })}
        style={{ marginTop: 10 }}
      />
      <PrimaryButton title="All quizzes" icon="format-list-bulleted" variant="outline" onPress={() => navigation.goBack()} style={{ marginTop: 10 }} />
    </ScrollView>
  );
}

function Reward({ icon, label, value }) {
  return (
    <View style={styles.reward}>
      <MaterialCommunityIcons name={icon} size={24} color={COLORS.primary} />
      <Text style={styles.rewardValue}>{value}</Text>
      <Text style={styles.rewardLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding, paddingBottom: 40, alignSelf: 'center' },
  hero: { borderRadius: SIZES.radiusLg, padding: 20, alignItems: 'center' },
  quizTitle: { fontFamily: FONTS.semiBold, color: COLORS.sky, fontSize: SIZES.body },
  gradeCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 6,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  grade: { fontFamily: FONTS.bold, fontSize: 54, lineHeight: 64 },
  score: { fontFamily: FONTS.semiBold, color: COLORS.white, fontSize: SIZES.h3 },
  message: { fontFamily: FONTS.regular, color: COLORS.sky, textAlign: 'center', marginTop: 4 },
  rewards: { flexDirection: 'row', gap: 10, marginVertical: 16 },
  reward: { flex: 1, backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  rewardValue: { fontFamily: FONTS.bold, fontSize: SIZES.h3, color: COLORS.text, marginTop: 4 },
  rewardLabel: { fontFamily: FONTS.regular, fontSize: SIZES.tiny, color: COLORS.textMuted },
  levelUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.sky,
    borderRadius: SIZES.radius,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
  },
  levelUpTitle: { fontFamily: FONTS.bold, color: COLORS.primaryDark },
  levelUpText: { fontFamily: FONTS.regular, color: COLORS.text, fontSize: SIZES.small },
});
