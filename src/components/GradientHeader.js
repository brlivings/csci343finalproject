import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, GRADIENTS, SIZES } from '../constants/theme';
import useResponsive from '../hooks/useResponsive';

export default function GradientHeader({ title, subtitle, right, children, compact }) {
  const insets = useSafeAreaInsets();
  const { s, isLandscape } = useResponsive();
  const tight = compact || isLandscape;

  return (
    <LinearGradient
      colors={GRADIENTS.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        {
          paddingTop: insets.top + (tight ? 8 : 16),
          paddingBottom: tight ? 14 : 24,
          paddingLeft: SIZES.padding + insets.left,
          paddingRight: SIZES.padding + insets.right,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.titles}>
          <Text style={[styles.title, { fontSize: s(tight ? SIZES.h2 : SIZES.h1) }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { fontSize: s(SIZES.small) }]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: SIZES.radiusLg,
    borderBottomRightRadius: SIZES.radiusLg,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  titles: { flex: 1, marginRight: 8 },
  title: { fontFamily: FONTS.bold, color: COLORS.white },
  subtitle: { fontFamily: FONTS.regular, color: COLORS.skyDark, marginTop: 2 },
});
