export const lightTheme = {
  bg: '#FBFAF6',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F1E8',
  border: '#E5DFD1',
  text: '#1A1814',
  textMuted: '#6B6557',
  textDim: '#9A9486',
  accent: '#2D4FE0',
  accentSoft: '#E6EBFA',
  success: '#1F8A5B',
  warn: '#B5773A',
  danger: '#C0392B',
};

export const darkTheme = {
  bg: '#1A1814',
  surface: '#252220',
  surfaceAlt: '#2D2A26',
  border: '#3A352E',
  text: '#F0EBE0',
  textMuted: '#A39B89',
  textDim: '#6B6557',
  accent: '#5C7CE8',
  accentSoft: '#2A3454',
  success: '#3FA876',
  warn: '#D49356',
  danger: '#D85040',
};

export type Theme = typeof lightTheme;

export function getTheme(dark: boolean): Theme {
  return dark ? darkTheme : lightTheme;
}
