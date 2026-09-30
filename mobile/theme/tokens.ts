/**
 * Mneme design tokens.
 *
 * Identity: warm "paper" neutrals, a deep ink-indigo primary and an amber
 * "spark" accent reserved for AI moments. Calm, low-contrast chrome so the
 * user's content carries the visual weight.
 */

export const palette = {
  ink50: '#F1F0FC',
  ink100: '#E3E1FA',
  ink200: '#C6C1F4',
  ink400: '#8C83EA',
  ink500: '#6558DD',
  ink600: '#4B3FC6',
  ink700: '#3A30A0',
  spark400: '#F5B454',
  spark500: '#EE9A2B',
  sage500: '#3E9A73',
  rose500: '#D8505C',
  paper0: '#FFFFFF',
  paper50: '#FBFAF7',
  paper100: '#F6F5F1',
  paper200: '#ECEAE4',
  paper300: '#DEDBD3',
  stone500: '#77756F',
  stone700: '#45443F',
  stone900: '#1C1C1E',
  night950: '#0E0E10',
  night900: '#121214',
  night850: '#18181B',
  night800: '#1F1F23',
  night700: '#2A2A2F',
  night600: '#3A3A40',
  mist300: '#A9A8B0',
  mist100: '#E9E8EE',
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  textOnPrimary: string;
  primary: string;
  /** Primary hue tuned for text/icons on neutral or soft-primary backgrounds. */
  primaryText: string;
  primaryPressed: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  success: string;
  danger: string;
  dangerSoft: string;
  overlay: string;
  skeleton: string;
}

export const lightColors: ThemeColors = {
  background: palette.paper100,
  surface: palette.paper0,
  surfaceRaised: palette.paper0,
  surfaceMuted: palette.paper200,
  border: palette.paper200,
  borderStrong: palette.paper300,
  text: palette.stone900,
  textMuted: palette.stone500,
  textSubtle: '#A3A19A',
  textOnPrimary: '#FFFFFF',
  primary: palette.ink600,
  primaryText: palette.ink600,
  primaryPressed: palette.ink700,
  primarySoft: palette.ink50,
  accent: palette.spark500,
  accentSoft: '#FDF1DE',
  success: palette.sage500,
  danger: palette.rose500,
  dangerSoft: '#FBE9EB',
  overlay: 'rgba(20, 18, 30, 0.38)',
  skeleton: palette.paper200,
};

export const darkColors: ThemeColors = {
  background: palette.night900,
  surface: palette.night850,
  surfaceRaised: '#2C2C32',
  surfaceMuted: '#222226',
  border: palette.night700,
  borderStrong: palette.night600,
  text: palette.mist100,
  textMuted: palette.mist300,
  textSubtle: '#6E6D75',
  textOnPrimary: '#FFFFFF',
  primary: palette.ink500,
  primaryText: '#ACA4F6',
  primaryPressed: palette.ink600,
  primarySoft: '#25224A',
  accent: palette.spark400,
  accentSoft: '#3A2C14',
  success: '#5BB88F',
  danger: '#EC6B75',
  dangerSoft: '#3A1D21',
  overlay: 'rgba(0, 0, 0, 0.6)',
  skeleton: palette.night700,
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700' as const, letterSpacing: -0.6 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const, letterSpacing: -0.3 },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const, letterSpacing: -0.1 },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 23, fontWeight: '600' as const },
  callout: { fontSize: 15, lineHeight: 21, fontWeight: '400' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  overline: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.6 },
} as const;

export type TypographyVariant = keyof typeof typography;

export interface Theme {
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
}

export const lightTheme: Theme = { scheme: 'light', colors: lightColors, spacing, radius, typography };
export const darkTheme: Theme = { scheme: 'dark', colors: darkColors, spacing, radius, typography };
