import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants/theme';

export default function EmptyState({ icon = 'flask-empty-outline', title, message, children }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.circle}>
        <MaterialCommunityIcons name={icon} size={40} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: 32 },
  circle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.sky,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { fontFamily: FONTS.semiBold, fontSize: SIZES.h3, color: COLORS.text, textAlign: 'center' },
  message: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    maxWidth: 320,
  },
});
