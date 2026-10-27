import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GradientHeader from '../components/GradientHeader';
import CompoundCard from '../components/CompoundCard';
import EmptyState from '../components/EmptyState';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { COMPOUNDS, FAMILIES } from '../data/compounds';
import { useBiohacker } from '../context/BiohackerContext';
import useResponsive from '../hooks/useResponsive';

export default function LibraryScreen({ navigation }) {
  const { state, toggleFavorite } = useBiohacker();
  const { columns, contentWidth } = useResponsive();
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Only letters, numbers, spaces and a few symbols are allowed in search.
  const invalidQuery = /[^\w\s\-'().]/.test(query);

  const results = useMemo(() => {
    if (invalidQuery) return [];
    const q = query.trim().toLowerCase();
    return COMPOUNDS.filter((c) => {
      if (family !== 'all' && c.family !== family) return false;
      if (favoritesOnly && !state.favorites.includes(c.id)) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        c.benefits.some((b) => b.toLowerCase().includes(q))
      );
    });
  }, [query, family, favoritesOnly, state.favorites, invalidQuery]);

  const gap = 12;
  const cardWidth = (contentWidth - SIZES.padding * 2 - gap * (columns - 1)) / columns;

  return (
    <View style={styles.screen}>
      <GradientHeader title="Compound Library" subtitle={`${COMPOUNDS.length} legal compounds · family › group › compound`}>
        <View style={[styles.searchBox, invalidQuery && { borderColor: COLORS.danger }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, group or benefit"
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
            autoCorrect={false}
            maxLength={40}
            returnKeyType="search"
            accessibilityLabel="Search compounds"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
              <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textMuted} />
            </Pressable>
          ) : null}
        </View>
        {invalidQuery ? <Text style={styles.searchError}>Please use letters and numbers only.</Text> : null}
      </GradientHeader>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Pressable
            onPress={() => setFavoritesOnly((v) => !v)}
            style={[styles.chip, favoritesOnly && styles.chipActive]}
            accessibilityState={{ selected: favoritesOnly }}
          >
            <MaterialCommunityIcons name="star" size={16} color={favoritesOnly ? COLORS.white : COLORS.warning} />
            <Text style={[styles.chipText, favoritesOnly && styles.chipTextActive]}>Favorites</Text>
          </Pressable>
          {[{ id: 'all', name: 'All', icon: 'view-grid' }, ...FAMILIES].map((f) => {
            const active = family === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFamily(f.id)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityState={{ selected: active }}
              >
                <MaterialCommunityIcons name={f.icon} size={16} color={active ? COLORS.white : COLORS.primary} />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        key={`cols-${columns}`}
        data={results}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        style={{ alignSelf: 'center', width: contentWidth }}
        contentContainerStyle={styles.list}
        columnWrapperStyle={columns > 1 ? { gap } : undefined}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <CompoundCard
            compound={item}
            compact={state.settings.compactCards}
            favorite={state.favorites.includes(item.id)}
            onToggleFavorite={() => toggleFavorite(item.id)}
            onPress={() => navigation.navigate('CompoundDetail', { id: item.id })}
            style={{ width: cardWidth, marginBottom: gap }}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="text-search"
            title="No compounds found"
            message={favoritesOnly ? 'Star compounds to add them to your favorites.' : 'Try a different search or family.'}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    paddingHorizontal: 12,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  searchInput: { flex: 1, minWidth: 0, fontFamily: FONTS.regular, fontSize: SIZES.body, color: COLORS.text, paddingVertical: 10, marginLeft: 8 },
  searchError: { fontFamily: FONTS.medium, fontSize: SIZES.tiny, color: COLORS.white, marginTop: 4 },
  chips: { paddingHorizontal: SIZES.padding, paddingVertical: 12, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontFamily: FONTS.medium, fontSize: SIZES.small, color: COLORS.text },
  chipTextActive: { color: COLORS.white },
  list: { paddingHorizontal: SIZES.padding, paddingBottom: 32 },
});
