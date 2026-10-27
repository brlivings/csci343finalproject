import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { getQuiz, prepareAttempt } from '../data/quizzes';
import { useBiohacker } from '../context/BiohackerContext';
import useResponsive from '../hooks/useResponsive';

export default function QuizPlayScreen({ route, navigation }) {
  const quiz = getQuiz(route.params?.quizId);
  const { state, finishQuiz, buzz } = useBiohacker();
  const { contentWidth, columns, isLandscape } = useResponsive();
  const questions = useMemo(() => (quiz ? prepareAttempt(quiz) : []), [quiz]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [correct, setCorrect] = useState(0);
  const finished = useRef(false);
  const progress = useRef(new Animated.Value(0)).current;

  const q = questions[index];
  const total = questions.length;

  useLayoutEffect(() => {
    navigation.setOptions({ title: quiz ? `${quiz.title} · ${index + 1}/${total}` : 'Quiz' });
  }, [navigation, quiz, index, total]);

  useEffect(() => {
    Animated.timing(progress, { toValue: (index + (picked ? 1 : 0)) / Math.max(total, 1), duration: 300, useNativeDriver: false }).start();
  }, [index, picked, total, progress]);

  // Confirm before abandoning a quiz in progress.
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (finished.current || (index === 0 && !picked)) return;
        e.preventDefault();
        Alert.alert('Quit quiz?', 'Your progress on this attempt will be lost and no rewards will be earned.', [
          { text: 'Keep going', style: 'cancel' },
          { text: 'Quit', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ]);
      }),
    [navigation, index, picked]
  );

  if (!quiz || !q) return null;

  const choose = (choice) => {
    if (picked) return;
    setPicked(choice);
    if (choice === q.answer) {
      setCorrect((c) => c + 1);
      buzz('success');
    } else {
      buzz();
    }
  };

  const next = () => {
    if (index + 1 < total) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    finished.current = true;
    const prevXp = state.progress.xp;
    finishQuiz(quiz.id, correct, total);
    navigation.replace('QuizResult', { quizId: quiz.id, prevXp });
  };

  const isRight = picked === q.answer;
  const choiceWidth = isLandscape || columns > 1 ? '48.5%' : '100%';

  return (
    <View style={styles.screen}>
      <View style={styles.track}>
        <Animated.View
          style={[styles.fill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
        />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { width: contentWidth }]}>
        <View style={styles.scoreRow}>
          <Text style={styles.qNum}>
            Question {index + 1} of {total}
          </Text>
          <Text style={styles.score}>
            <MaterialCommunityIcons name="check-circle" size={14} color={COLORS.success} /> {correct}
          </Text>
        </View>
        <Text style={styles.prompt}>{q.prompt}</Text>

        <View style={styles.choices}>
          {q.choices.map((choice, i) => {
            const isAnswer = choice === q.answer;
            const isPicked = choice === picked;
            let status = 'idle';
            if (picked && isAnswer) status = 'right';
            else if (picked && isPicked) status = 'wrong';
            return (
              <Pressable
                key={choice}
                onPress={() => choose(choice)}
                disabled={!!picked}
                style={({ pressed }) => [
                  styles.choice,
                  { width: choiceWidth },
                  status === 'right' && styles.right,
                  status === 'wrong' && styles.wrong,
                  pressed && !picked && { backgroundColor: COLORS.sky },
                ]}
                accessibilityRole="button"
              >
                <View style={[styles.letter, status !== 'idle' && { backgroundColor: COLORS.white }]}>
                  <Text style={styles.letterText}>{String.fromCharCode(65 + i)}</Text>
                </View>
                <Text style={[styles.choiceText, status !== 'idle' && { color: COLORS.white }]}>{choice}</Text>
                {status === 'right' ? <MaterialCommunityIcons name="check" size={22} color={COLORS.white} /> : null}
                {status === 'wrong' ? <MaterialCommunityIcons name="close" size={22} color={COLORS.white} /> : null}
              </Pressable>
            );
          })}
        </View>

        {picked ? (
          <View style={[styles.feedback, { borderLeftColor: isRight ? COLORS.success : COLORS.danger }]}>
            <Text style={[styles.feedbackTitle, { color: isRight ? COLORS.success : COLORS.danger }]}>
              {isRight ? 'Correct!' : 'Not quite.'}
            </Text>
            <Text style={styles.explain}>{q.explain}</Text>
            <PrimaryButton
              title={index + 1 < total ? 'Next question' : 'See results'}
              icon={index + 1 < total ? 'arrow-right' : 'flag-checkered'}
              onPress={next}
              style={{ marginTop: 12 }}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  track: { height: 6, backgroundColor: COLORS.skyDark },
  fill: { height: 6, backgroundColor: COLORS.primary },
  content: { padding: SIZES.padding, paddingBottom: 40, alignSelf: 'center' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  qNum: { fontFamily: FONTS.medium, color: COLORS.primary, fontSize: SIZES.small },
  score: { fontFamily: FONTS.semiBold, color: COLORS.success, fontSize: SIZES.small },
  prompt: { fontFamily: FONTS.semiBold, fontSize: SIZES.h3, color: COLORS.text, lineHeight: 26, marginBottom: 16 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    padding: 12,
    marginBottom: 10,
  },
  right: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  wrong: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  letter: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.sky, alignItems: 'center', justifyContent: 'center' },
  letterText: { fontFamily: FONTS.bold, color: COLORS.primary },
  choiceText: { flex: 1, fontFamily: FONTS.medium, color: COLORS.text, fontSize: SIZES.body },
  feedback: { backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: 14, borderLeftWidth: 5, marginTop: 6 },
  feedbackTitle: { fontFamily: FONTS.bold, fontSize: SIZES.body + 1 },
  explain: { fontFamily: FONTS.regular, color: COLORS.text, fontSize: SIZES.small, lineHeight: 20, marginTop: 4 },
});
