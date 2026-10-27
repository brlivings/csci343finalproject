import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EVIDENCE, FONTS, SIZES } from '../constants/theme';

export default function EvidenceBadge({ grade, showLabel = false }) {
  const info = EVIDENCE[grade] || EVIDENCE.C;
  return (
    <View style={[styles.badge, { backgroundColor: info.color + '1A', borderColor: info.color }]}>
      <Text style={[styles.text, { color: info.color }]}>
        {showLabel ? `${grade} · ${info.label}` : `Evidence ${grade}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  text: { fontFamily: FONTS.medium, fontSize: SIZES.tiny },
});
