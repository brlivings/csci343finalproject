import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOW, SIZES } from '../constants/theme';
import { getFamily } from '../data/compounds';
import EvidenceBadge from './EvidenceBadge';

export default function CompoundCard({ compound, onPress, favorite, onToggleFavorite, compact, style }) {
  const family = getFamily(compound.family);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, SHADOW, { opacity: pressed ? 0.9 : 1 }, style]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${compound.name}`}
    >
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={family?.icon || 'pill'} size={24} color={COLORS.primary} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {compound.name}
        </Text>
        <Text style={styles.group} numberOfLines={1}>
          {family?.name} › {compound.group}
        </Text>
        {!compact ? (
          <Text style={styles.summary} numberOfLines={2}>
            {compound.summary}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <EvidenceBadge grade={compound.evidence} />
          <Text style={styles.dose}>
            {compound.dose.min}–{compound.dose.max} {compound.dose.unit}
          </Text>
        </View>
      </View>
      {onToggleFavorite ? (
        <Pressable
          onPress={onToggleFavorite}
          hitSlop={12}
          style={styles.fav}
          accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <MaterialCommunityIcons
            name={favorite ? 'star' : 'star-outline'}
            size={24}
            color={favorite ? COLORS.warning : COLORS.textMuted}
          />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.sky,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  body: { flex: 1 },
  name: { fontFamily: FONTS.semiBold, fontSize: SIZES.body + 1, color: COLORS.text },
  group: { fontFamily: FONTS.regular, fontSize: SIZES.tiny, color: COLORS.primary, marginBottom: 4 },
  summary: { fontFamily: FONTS.regular, fontSize: SIZES.small, color: COLORS.textMuted, lineHeight: 19 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  dose: { fontFamily: FONTS.medium, fontSize: SIZES.small, color: COLORS.text },
  fav: { paddingLeft: 8 },
});
