// App-wide state management with the Context API + useReducer.
// State is persisted to the device's internal storage with AsyncStorage.
import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { STORAGE_KEYS } from '../constants/theme';
import { EQUIPMENT, STARTING_COINS, gradeFor, quizRewards } from '../data/gym';

const initialState = {
  profile: { name: '' },
  stack: [], // { id, compoundId, dose, unit, slot }
  logs: [], // { id, compoundId, dose, unit, takenAt, note }
  favorites: [], // compoundIds
  settings: {
    haptics: true,
    biometricLock: false,
    showCautions: true,
    compactCards: false,
  },
  // Gamification: quizzes earn XP + coins that grow the virtual gym.
  progress: {
    xp: 0,
    coins: STARTING_COINS,
    quizHistory: [], // { id, quizId, correct, total, percent, grade, coins, xp, takenAt }
    best: {}, // quizId -> best percent
  },
  gym: {
    name: 'My Biohacker Gym',
    floor: 'oak',
    wall: 'white',
    items: [], // { id, itemId, x, y, rotation }
    lastCollectedAt: null,
  },
};

const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...initialState,
        ...action.payload,
        settings: { ...initialState.settings, ...(action.payload.settings || {}) },
        progress: { ...initialState.progress, ...(action.payload.progress || {}) },
        gym: {
          ...initialState.gym,
          ...(action.payload.gym || {}),
          items: (action.payload.gym?.items || []).filter((i) => Number.isInteger(i.x) && Number.isInteger(i.y)),
        },
      };
    case 'SET_NAME':
      return { ...state, profile: { ...state.profile, name: action.name } };
    case 'ADD_TO_STACK':
      return { ...state, stack: [...state.stack, { id: makeId(), ...action.item }] };
    case 'UPDATE_STACK_ITEM':
      return {
        ...state,
        stack: state.stack.map((s) => (s.id === action.id ? { ...s, ...action.changes } : s)),
      };
    case 'REMOVE_FROM_STACK':
      return { ...state, stack: state.stack.filter((s) => s.id !== action.id) };
    case 'LOG_DOSE':
      return {
        ...state,
        logs: [{ id: makeId(), takenAt: new Date().toISOString(), ...action.entry }, ...state.logs],
      };
    case 'DELETE_LOG':
      return { ...state, logs: state.logs.filter((l) => l.id !== action.id) };
    case 'TOGGLE_FAVORITE': {
      const has = state.favorites.includes(action.compoundId);
      return {
        ...state,
        favorites: has
          ? state.favorites.filter((f) => f !== action.compoundId)
          : [...state.favorites, action.compoundId],
      };
    }
    case 'SET_SETTING':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } };
    case 'FINISH_QUIZ': {
      const { quizId, correct, total } = action;
      const percent = Math.round((correct / total) * 100);
      const prevBest = state.progress.best[quizId] ?? null;
      const { coins, xp } = quizRewards({ correct, total, prevBest });
      const entry = {
        id: makeId(),
        quizId,
        correct,
        total,
        percent,
        grade: gradeFor(percent),
        coins,
        xp,
        takenAt: new Date().toISOString(),
      };
      return {
        ...state,
        progress: {
          ...state.progress,
          xp: state.progress.xp + xp,
          coins: state.progress.coins + coins,
          quizHistory: [entry, ...state.progress.quizHistory].slice(0, 100),
          best: { ...state.progress.best, [quizId]: Math.max(prevBest ?? 0, percent) },
        },
        lastQuizResult: entry,
      };
    }
    case 'BUY_ITEM': {
      const item = EQUIPMENT.find((e) => e.id === action.itemId);
      if (!item || state.progress.coins < item.cost) return state;
      if (!Number.isInteger(action.x) || !Number.isInteger(action.y)) return state;
      return {
        ...state,
        progress: { ...state.progress, coins: state.progress.coins - item.cost },
        gym: {
          ...state.gym,
          items: [...state.gym.items, { id: makeId(), itemId: item.id, x: action.x, y: action.y, rotation: 0 }],
        },
      };
    }
    case 'MOVE_ITEM':
      return {
        ...state,
        gym: {
          ...state.gym,
          items: state.gym.items.map((i) => (i.id === action.id ? { ...i, x: action.x, y: action.y } : i)),
        },
      };
    case 'ROTATE_ITEM':
      return {
        ...state,
        gym: {
          ...state.gym,
          items: state.gym.items.map((i) =>
            i.id === action.id ? { ...i, rotation: ((i.rotation || 0) + 1) % 4 } : i
          ),
        },
      };
    case 'SELL_ITEM': {
      const placed = state.gym.items.find((i) => i.id === action.id);
      const item = placed && EQUIPMENT.find((e) => e.id === placed.itemId);
      if (!placed) return state;
      return {
        ...state,
        progress: { ...state.progress, coins: state.progress.coins + Math.floor((item?.cost || 0) / 2) },
        gym: { ...state.gym, items: state.gym.items.filter((i) => i.id !== action.id) },
      };
    }
    case 'SET_GYM':
      return { ...state, gym: { ...state.gym, ...action.changes } };
    case 'COLLECT_REVENUE':
      return {
        ...state,
        progress: { ...state.progress, coins: state.progress.coins + action.amount },
        gym: { ...state.gym, lastCollectedAt: action.at },
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const BiohackerContext = createContext(null);

export function BiohackerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  // Load saved state from internal storage once on launch.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.state);
        if (raw) dispatch({ type: 'HYDRATE', payload: JSON.parse(raw) });
      } catch (e) {
        console.warn('Failed to load saved data', e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Persist every change after hydration.
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEYS.state, JSON.stringify(state)).catch((e) =>
      console.warn('Failed to save data', e)
    );
  }, [state, hydrated]);

  const value = useMemo(() => {
    const buzz = (kind = 'light') => {
      if (!state.settings.haptics) return;
      if (kind === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    };

    return {
      state,
      hydrated,
      buzz,
      setName: (name) => dispatch({ type: 'SET_NAME', name }),
      addToStack: (item) => {
        dispatch({ type: 'ADD_TO_STACK', item });
        buzz('success');
      },
      updateStackItem: (id, changes) => dispatch({ type: 'UPDATE_STACK_ITEM', id, changes }),
      removeFromStack: (id) => {
        dispatch({ type: 'REMOVE_FROM_STACK', id });
        buzz();
      },
      logDose: (entry) => {
        dispatch({ type: 'LOG_DOSE', entry });
        buzz('success');
      },
      deleteLog: (id) => dispatch({ type: 'DELETE_LOG', id }),
      toggleFavorite: (compoundId) => {
        dispatch({ type: 'TOGGLE_FAVORITE', compoundId });
        buzz();
      },
      setSetting: (key, value) => dispatch({ type: 'SET_SETTING', key, value }),
      resetAll: () => dispatch({ type: 'RESET' }),
      finishQuiz: (quizId, correct, total) => {
        dispatch({ type: 'FINISH_QUIZ', quizId, correct, total });
        buzz('success');
      },
      buyItem: (itemId, x, y) => {
        dispatch({ type: 'BUY_ITEM', itemId, x, y });
        buzz('success');
      },
      moveItem: (id, x, y) => {
        dispatch({ type: 'MOVE_ITEM', id, x, y });
        buzz();
      },
      rotateItem: (id) => {
        dispatch({ type: 'ROTATE_ITEM', id });
        buzz();
      },
      sellItem: (id) => {
        dispatch({ type: 'SELL_ITEM', id });
        buzz();
      },
      setGym: (changes) => dispatch({ type: 'SET_GYM', changes }),
      collectRevenue: (amount) => {
        dispatch({ type: 'COLLECT_REVENUE', amount, at: new Date().toISOString() });
        buzz('success');
      },
    };
  }, [state, hydrated]);

  return <BiohackerContext.Provider value={value}>{children}</BiohackerContext.Provider>;
}

export function useBiohacker() {
  const ctx = useContext(BiohackerContext);
  if (!ctx) throw new Error('useBiohacker must be used inside BiohackerProvider');
  return ctx;
}

export const isSameDay = (iso, date = new Date()) => {
  const d = new Date(iso);
  return (
    d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate()
  );
};
