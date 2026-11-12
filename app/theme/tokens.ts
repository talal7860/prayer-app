// Design tokens from the "Adhan App Redesign" canvas.
export type Palette = {
  bg: string;
  surface: string;
  /** Cards that sit on `surface` (the iPad prayer cards). */
  raised: string;
  text: string;
  muted: string;
  border: string;
  divider: string;
  hi: string;
  accent: string;
  onAccent: string;
  past: string;
  track: string;
  trackOff: string;
};

export const light: Palette = {
  bg: '#FFFFFF',
  surface: '#F5F6F9',
  raised: '#FFFFFF',
  text: '#14161C',
  muted: '#5A6070',
  border: '#E7E9EF',
  divider: '#EEF0F4',
  hi: '#EDF2FC',
  accent: '#2453B3',
  onAccent: '#FFFFFF',
  past: '#6B7180',
  track: '#EEF0F4',
  trackOff: '#C7CBD6',
};

export const dark: Palette = {
  bg: '#0D1120',
  surface: '#080B16',
  raised: '#141A2C',
  text: '#EEF1F8',
  muted: '#A4ABC2',
  border: '#222943',
  divider: '#1A2038',
  hi: '#1A2240',
  accent: '#9DB8FF',
  onAccent: '#0D1120',
  past: '#8C93AA',
  track: '#1A2038',
  trackOff: '#3A4260',
};

export type Period = 'fajr' | 'morning' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

/** Sky gradient stops, top to bottom, for the Today header. */
export const skies: Record<Period, [string, string, string]> = {
  fajr: ['#161D45', '#3B3470', '#7A5683'],
  morning: ['#1E4B86', '#3E6CA6', '#7A6E9C'],
  dhuhr: ['#164A8A', '#2763A3', '#3271B0'],
  asr: ['#1C4872', '#3A6584', '#85602D'],
  maghrib: ['#281C4C', '#6E2A52', '#A8432C'],
  isha: ['#060A1C', '#0F1836', '#1B2650'],
};

export const skyLocations: [number, number, number] = [0, 0.55, 1];

export const fonts = {
  light: 'Inter_300Light',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** The Kaaba marker on the qibla dial: black with a gold band, the same in light and dark. */
export const kaaba = {body: '#111318', band: '#D9B44A', edge: 'rgba(255,255,255,0.35)'};

export const radius = {card: 18, row: 14, pill: 999, control: 11};
