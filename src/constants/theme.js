// Biohacker app-wide theme constants (blue & white).
import { Dimensions } from 'react-native';

export const COLORS = {
  primary: '#1565C0',
  primaryDark: '#0D47A1',
  primaryLight: '#42A5F5',
  accent: '#00B0FF',
  sky: '#E3F2FD',
  skyDark: '#BBDEFB',
  white: '#FFFFFF',
  background: '#F5F9FF',
  card: '#FFFFFF',
  text: '#0B1F3A',
  textMuted: '#5B6B82',
  border: '#D6E4F5',
  success: '#2E7D32',
  warning: '#F9A825',
  danger: '#C62828',
  overlay: 'rgba(11, 31, 58, 0.55)',
};

export const GRADIENTS = {
  header: ['#0D47A1', '#1565C0', '#42A5F5'],
  card: ['#FFFFFF', '#E3F2FD'],
  button: ['#1565C0', '#1E88E5'],
  splash: ['#0D47A1', '#1E88E5'],
};

export const FONTS = {
  light: 'Poppins_300Light',
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

export const SIZES = {
  base: 8,
  radius: 14,
  radiusLg: 22,
  padding: 16,
  h1: 28,
  h2: 22,
  h3: 18,
  body: 15,
  small: 13,
  tiny: 11,
};

// Scales a size relative to a 390pt-wide reference phone so text and
// spacing adapt to any screen, clamped so tablets don't get giant UI.
export const scale = (size, width = Dimensions.get('window').width) => {
  const factor = Math.min(Math.max(width / 390, 0.85), 1.25);
  return Math.round(size * factor);
};

export const SHADOW = {
  shadowColor: '#0D47A1',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 10,
  elevation: 4,
};

export const EVIDENCE = {
  A: { label: 'Strong evidence', color: '#2E7D32' },
  B: { label: 'Moderate evidence', color: '#1565C0' },
  C: { label: 'Limited evidence', color: '#F9A825' },
};

export const STORAGE_KEYS = {
  state: '@biohacker/state/v1',
};

export const LINKS = {
  pubchemSearch: (q) => `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(q)}`,
  examine: (slug) => `https://examine.com/supplements/${slug}/`,
  pubmed: (q) => `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q)}`,
  sourceTree: 'https://maxpharma.wiki/compound-tree',
  fdaSupplements: 'https://www.fda.gov/food/dietary-supplements',
};
