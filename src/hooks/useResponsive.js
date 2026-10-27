// Responsive helpers: re-render on rotation / resize and expose layout info.
import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { scale } from '../constants/theme';

export default function useResponsive() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isLandscape = width > height;
    const isTablet = Math.min(width, height) >= 600;
    // Grid columns grow with available width (phone portrait = 1, tablets/landscape = 2-3).
    const columns = width >= 1000 ? 3 : width >= 600 ? 2 : 1;
    // Keep content readable on very wide screens.
    const contentWidth = Math.min(width, 1100);
    return {
      width,
      height,
      isLandscape,
      isTablet,
      columns,
      contentWidth,
      s: (size) => scale(size, Math.min(width, height)),
    };
  }, [width, height]);
}
