import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, GRADIENTS, SIZES } from '../constants/theme';

export default function PrimaryButton({ title, icon, onPress, variant = 'solid', disabled, style }) {
  const outline = variant === 'outline';
  const content = (
    <View style={styles.inner}>
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={outline ? COLORS.primary : COLORS.white}
          style={{ marginRight: 8 }}
        />
      ) : null}
      <Text style={[styles.text, outline && { color: COLORS.primary }]}>{title}</Text>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        outline && styles.outline,
        { opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {outline ? (
        content
      ) : (
        <LinearGradient colors={GRADIENTS.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
          {content}
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: SIZES.radius, overflow: 'hidden', minHeight: 48 },
  outline: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  gradient: { flex: 1, justifyContent: 'center', paddingHorizontal: 16, minHeight: 48 },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: FONTS.semiBold, color: COLORS.white, fontSize: SIZES.body },
});
