import AsyncStorage from '@react-native-async-storage/async-storage';
import {merge} from 'lodash/fp';

export const SETTINGS_KEY = '@prayer_app:settings';

export const defaultSettings: Settings = Object.freeze({
  location: {
    // default is calgary
    lat: 51.05011,
    lng: -114.08529,
  },
  city: 'Calgary, AB',
  calculationMethod: 'Karachi',
  asr: 'Hanafi',
  sound: 'mecca',
  muted: {sunrise: true},
  adjustments: {},
  travelAlerts: false,
  headsUp: false,
  timeFormat: '12h',
  highLats: 'NightMiddle',
  onboarded: false,
});

/** Saved settings on top of `base`, with old keys dropped. */
export const parseSettings = (
  stored: string | null,
  base: Settings = defaultSettings,
): Settings => {
  // `fajrIshaCalculation` (the old 90-minute rule) was removed; drop it if saved.
  const {fajrIshaCalculation: _removed, ...parsed}: Partial<Settings> & {
    fajrIshaCalculation?: string;
  } = stored ? JSON.parse(stored) : {};
  const next: Settings = merge(base)(parsed);
  // Installed before the setup screen existed: they've already set things up.
  if (stored && parsed.onboarded === undefined) {
    next.onboarded = true;
  }
  // Saved before city names existed: don't show the default city for it.
  return parsed.location && !parsed.city ? {...next, city: undefined} : next;
};

/** Read the saved settings outside React (the background task). */
export const loadSettings = async (): Promise<Settings> =>
  parseSettings(await AsyncStorage.getItem(SETTINGS_KEY));
