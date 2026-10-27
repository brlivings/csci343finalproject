// Quiz bank built from the compound library so every answer comes straight
// from the information in the app. Questions are generated deterministically
// (seeded) and then shuffled fresh each attempt.
import { COMPOUNDS, FAMILIES, getFamily } from './compounds';

// Small seeded RNG so a quiz's question set is stable.
const rng = (seed) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

export const shuffle = (arr, rand = Math.random) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const hash = (str) => [...str].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

const doseText = (c) => `${c.dose.min}–${c.dose.max} ${c.dose.unit}`;

// Picks `n` distinct distractor values that differ from the correct one.
const distractors = (correct, pool, n, rand) =>
  shuffle([...new Set(pool.filter((v) => v !== correct))], rand).slice(0, n);

// ---- Question builders --------------------------------------------------
const builders = {
  dose: (c, rand) => ({
    prompt: `What is the typical daily dose range for ${c.name}?`,
    answer: doseText(c),
    options: distractors(doseText(c), COMPOUNDS.map(doseText), 3, rand),
    explain: `${c.name} is commonly taken at ${doseText(c)}. ${c.timing}`,
  }),
  family: (c, rand) => {
    const answer = getFamily(c.family).name;
    return {
      prompt: `In the compound tree, which family does ${c.name} belong to?`,
      answer,
      options: distractors(answer, FAMILIES.map((f) => f.name), 3, rand),
      explain: `${c.name} sits under ${answer} › ${c.group}.`,
    };
  },
  benefit: (c, rand) => {
    const answer = c.benefits[0];
    const pool = COMPOUNDS.filter((o) => o.family !== c.family).flatMap((o) => o.benefits);
    return {
      prompt: `Which of these is a primary benefit of ${c.name}?`,
      answer,
      options: distractors(answer, pool.filter((b) => !c.benefits.includes(b)), 3, rand),
      explain: c.summary,
    };
  },
  identify: (c, rand) => {
    const answer = c.name;
    const pool = COMPOUNDS.filter((o) => o.id !== c.id).map((o) => o.name);
    return {
      prompt: `Which compound matches this description?\n“${c.summary}”`,
      answer,
      options: distractors(answer, pool, 3, rand),
      explain: `That describes ${c.name}.`,
    };
  },
  caution: (c, rand) => {
    const answer = c.name;
    const pool = COMPOUNDS.filter((o) => o.id !== c.id).map((o) => o.name);
    return {
      prompt: `Which compound carries this safety note?\n“${c.cautions}”`,
      answer,
      options: distractors(answer, pool, 3, rand),
      explain: `${c.name}: ${c.cautions}`,
    };
  },
  evidence: (c, rand) => {
    const labels = { A: 'Strong', B: 'Moderate', C: 'Limited' };
    const answer = labels[c.evidence];
    return {
      prompt: `How strong is the research evidence for ${c.name}?`,
      answer,
      options: distractors(answer, Object.values(labels), 2, rand),
      explain: `${c.name} is rated evidence grade ${c.evidence} (${answer.toLowerCase()}).`,
    };
  },
  timing: (c, rand) => {
    const answer = c.timing;
    const pool = COMPOUNDS.filter((o) => o.id !== c.id).map((o) => o.timing);
    return {
      prompt: `What is the recommended timing for ${c.name}?`,
      answer,
      options: distractors(answer, pool, 3, rand),
      explain: `${c.name}: ${c.timing}`,
    };
  },
};

const buildQuestions = (quizId, compounds, types, count) => {
  const rand = rng(hash(quizId));
  const combos = shuffle(
    compounds.flatMap((c) => types.map((t) => [c, t])),
    rand
  );
  // Prefer covering different compounds before repeating one.
  const seen = new Set();
  const ordered = [
    ...combos.filter(([c]) => (seen.has(c.id) ? false : seen.add(c.id))),
    ...combos,
  ];
  const used = new Set();
  const questions = [];
  for (const [c, t] of ordered) {
    const key = `${c.id}-${t}`;
    if (used.has(key)) continue;
    used.add(key);
    const q = builders[t](c, rand);
    if (q.options.length < 2) continue;
    questions.push({ id: key, compoundId: c.id, ...q, choices: [q.answer, ...q.options] });
    if (questions.length >= count) break;
  }
  return questions;
};

const familyQuizzes = FAMILIES.map((f) => {
  const compounds = COMPOUNDS.filter((c) => c.family === f.id);
  return {
    id: `family-${f.id}`,
    title: f.name,
    description: `Test what you know about ${f.name.toLowerCase()} in the compound tree.`,
    icon: f.icon,
    difficulty: 'Beginner',
    questions: buildQuestions(`family-${f.id}`, compounds, ['family', 'benefit', 'dose', 'identify'], 8),
  };
});

export const QUIZZES = [
  ...familyQuizzes,
  {
    id: 'dosing-master',
    title: 'Dosing Master',
    description: 'Know your milligrams from your grams? Typical ranges and timing.',
    icon: 'scale-balance',
    difficulty: 'Intermediate',
    questions: buildQuestions('dosing-master', COMPOUNDS, ['dose', 'timing'], 10),
  },
  {
    id: 'safety-first',
    title: 'Safety First',
    description: 'Match the caution to the compound. Safety is the first rule of biohacking.',
    icon: 'shield-check',
    difficulty: 'Intermediate',
    questions: buildQuestions('safety-first', COMPOUNDS, ['caution'], 10),
  },
  {
    id: 'evidence-check',
    title: 'Evidence Check',
    description: 'Which compounds are backed by strong research and which are still unproven?',
    icon: 'microscope',
    difficulty: 'Advanced',
    questions: buildQuestions('evidence-check', COMPOUNDS, ['evidence', 'identify'], 10),
  },
  {
    id: 'grand-tree',
    title: 'The Grand Tree',
    description: 'Fifteen questions from every branch of the tree. The ultimate test.',
    icon: 'file-tree',
    difficulty: 'Expert',
    questions: buildQuestions('grand-tree', COMPOUNDS, Object.keys(builders), 15),
  },
];

export const getQuiz = (id) => QUIZZES.find((q) => q.id === id);

// Fresh order of questions and answer choices for each attempt.
export const prepareAttempt = (quiz) =>
  shuffle(quiz.questions).map((q) => ({ ...q, choices: shuffle(q.choices) }));
