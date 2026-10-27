// Virtual gym economy: levels, equipment catalog, styles and reward math.

export const STARTING_COINS = 150;

// ---- Levels -------------------------------------------------------------
// XP needed to REACH a level grows quadratically: L2 = 100, L3 = 400, L4 = 900...
export const levelForXp = (xp) => Math.floor(Math.sqrt(xp / 100)) + 1;
export const xpForLevel = (level) => (level - 1) ** 2 * 100;

export const levelProgress = (xp) => {
  const level = levelForXp(xp);
  const start = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, current: xp - start, needed: next - start, pct: (xp - start) / (next - start) };
};

// Floor grows as you level up.
export const gridSizeForLevel = (level) => (level >= 7 ? 8 : level >= 4 ? 7 : level >= 2 ? 6 : 5);

// ---- Quiz grading & rewards ----------------------------------------------
export const gradeFor = (percent) =>
  percent >= 90 ? 'A' : percent >= 80 ? 'B' : percent >= 70 ? 'C' : percent >= 60 ? 'D' : 'F';

export const GRADE_COLORS = { A: '#2E7D32', B: '#1565C0', C: '#0288D1', D: '#F9A825', F: '#C62828' };

const GRADE_BONUS = { A: 100, B: 60, C: 30, D: 10, F: 0 };

// Better grades and new personal bests earn more. Replays still pay a little
// so practicing is worthwhile, but the big XP comes from improving.
export function quizRewards({ correct, total, prevBest }) {
  const percent = Math.round((correct / total) * 100);
  const grade = gradeFor(percent);
  const firstTime = prevBest === null || prevBest === undefined;
  const improved = !firstTime && percent > prevBest;
  const base = correct * 10 + GRADE_BONUS[grade];
  const coins = firstTime || improved ? base : Math.round(base * 0.4);
  const xp = firstTime
    ? correct * 20 + GRADE_BONUS[grade]
    : improved
    ? (percent - prevBest) * 3 + GRADE_BONUS[grade] / 2
    : correct * 4;
  return { coins, xp: Math.round(xp) };
}

// ---- Equipment -----------------------------------------------------------
// appeal: how many customers it attracts. height: block height for the 3D render.
export const EQUIPMENT = [
  { id: 'dumbbells', name: 'Dumbbell Rack', icon: 'dumbbell', color: '#455A64', cost: 80, level: 1, appeal: 3, height: 18 },
  { id: 'bench', name: 'Flat Bench', icon: 'seat-flat', color: '#1565C0', cost: 60, level: 1, appeal: 2, height: 14 },
  { id: 'yoga', name: 'Yoga Mats', icon: 'yoga', color: '#26A69A', cost: 50, level: 1, appeal: 2, height: 6 },
  { id: 'treadmill', name: 'Treadmill', icon: 'run', color: '#37474F', cost: 180, level: 2, appeal: 5, height: 22 },
  { id: 'bike', name: 'Spin Bike', icon: 'bike', color: '#0277BD', cost: 160, level: 2, appeal: 4, height: 20 },
  { id: 'squat-rack', name: 'Squat Rack', icon: 'weight-lifter', color: '#263238', cost: 260, level: 3, appeal: 7, height: 34 },
  { id: 'rower', name: 'Rowing Machine', icon: 'rowing', color: '#00838F', cost: 240, level: 3, appeal: 5, height: 12 },
  { id: 'kettlebells', name: 'Kettlebell Set', icon: 'kettlebell', color: '#5D4037', cost: 140, level: 3, appeal: 4, height: 12 },
  { id: 'cable', name: 'Cable Machine', icon: 'arrow-expand-vertical', color: '#1E88E5', cost: 420, level: 4, appeal: 9, height: 38 },
  { id: 'supplement-bar', name: 'Supplement Bar', icon: 'cup', color: '#0D47A1', cost: 500, level: 5, appeal: 10, height: 24, income: 25 },
  { id: 'smith', name: 'Smith Machine', icon: 'human-handsup', color: '#424242', cost: 600, level: 5, appeal: 11, height: 40 },
  { id: 'sauna', name: 'Infrared Sauna', icon: 'fire', color: '#E65100', cost: 800, level: 6, appeal: 14, height: 36 },
  { id: 'cold-plunge', name: 'Cold Plunge', icon: 'snowflake', color: '#4FC3F7', cost: 900, level: 7, appeal: 15, height: 16 },
  { id: 'red-light', name: 'Red Light Panel', icon: 'lightbulb-on', color: '#C62828', cost: 1100, level: 8, appeal: 17, height: 40 },
  { id: 'hyperbaric', name: 'Hyperbaric Pod', icon: 'atom', color: '#5C6BC0', cost: 1600, level: 10, appeal: 24, height: 22 },
];

export const getEquipment = (id) => EQUIPMENT.find((e) => e.id === id);

// ---- Styles (gym design) -------------------------------------------------
export const FLOORS = [
  { id: 'oak', name: 'Oak Wood', level: 1, colors: ['#D7B98E', '#CBA977'] },
  { id: 'rubber', name: 'Black Rubber', level: 1, colors: ['#3A3F47', '#31353C'] },
  { id: 'ice', name: 'Ice Blue', level: 2, colors: ['#BBDEFB', '#A5CFF5'] },
  { id: 'turf', name: 'Turf', level: 3, colors: ['#66BB6A', '#5AAE5E'] },
  { id: 'marble', name: 'White Marble', level: 5, colors: ['#F5F7FA', '#E4E9F0'] },
  { id: 'neon', name: 'Neon Grid', level: 8, colors: ['#0D1B3E', '#132656'] },
];

export const WALLS = [
  { id: 'white', name: 'Clean White', level: 1, colors: ['#FFFFFF', '#E8EEF6'] },
  { id: 'blue', name: 'Biohacker Blue', level: 1, colors: ['#1E88E5', '#1565C0'] },
  { id: 'navy', name: 'Navy', level: 3, colors: ['#1A2B4C', '#13203A'] },
  { id: 'concrete', name: 'Concrete', level: 4, colors: ['#B0BEC5', '#90A4AE'] },
  { id: 'glass', name: 'Glass', level: 6, colors: ['#E1F5FE', '#B3E5FC'] },
];

// ---- Customers & money ---------------------------------------------------
export const CUSTOMER_CAPACITY_PER_TILE = 0.6;
export const MEMBERSHIP_PER_HOUR = 4; // coins per customer per hour
export const MAX_ACCRUAL_HOURS = 8;

export function gymStats(items, level) {
  const size = gridSizeForLevel(level);
  const capacity = Math.floor(size * size * CUSTOMER_CAPACITY_PER_TILE);
  let appeal = 0;
  let bonusIncome = 0;
  items.forEach((placed) => {
    const eq = getEquipment(placed.itemId);
    if (!eq) return;
    appeal += eq.appeal;
    bonusIncome += eq.income || 0;
  });
  // Variety bonus: more unique machines draw more members.
  const variety = new Set(items.map((i) => i.itemId)).size;
  const customers = Math.min(capacity, Math.floor(appeal * (1 + variety * 0.05)));
  const incomePerHour = customers * MEMBERSHIP_PER_HOUR + bonusIncome;
  const rating = Math.min(5, Math.max(1, Math.round((customers / Math.max(capacity, 1)) * 5)));
  return { size, capacity, customers, incomePerHour, rating, variety };
}

export function pendingRevenue(lastCollectedAt, incomePerHour, now = Date.now()) {
  if (!lastCollectedAt) return 0;
  const hours = Math.min((now - new Date(lastCollectedAt).getTime()) / 3.6e6, MAX_ACCRUAL_HOURS);
  return Math.max(0, Math.floor(hours * incomePerHour));
}
