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
  fajrAdhan: true,
  muted: {sunrise: true},
  adjustments: {},
  headsUp: false,
  // Opt-in: off until someone turns it on (setup or Settings → Notifications).
  liveActivity: false,
  timeFormat: '12h',
  highLats: 'NightMiddle',
  onboarded: false,
});

/** Adhan sounds that were removed; a saved one goes back to Makkah. */
const REMOVED_SOUNDS = ['istanbul', 'konya', 'casablanca', 'tripoli', 'isfahan', 'azeez'];

/** What may be saved: any subset of the settings, plus keys from older versions. */
type StoredSettings = Partial<Settings> & {fajrIshaCalculation?: string; travelAlerts?: boolean};

/** Saved settings on top of `base`, with old keys dropped. */
export const parseSettings = (
  stored: string | null,
  base: Settings = defaultSettings,
): Settings => {
  // Removed settings, dropped if saved: `fajrIshaCalculation` (the old 90-minute rule) and
  // `travelAlerts` (background "Always" location).
  const {
    fajrIshaCalculation: _removed,
    travelAlerts: _travel,
    ...parsed
  } = stored ? (JSON.parse(stored) as StoredSettings) : {};
  const next: Settings = merge(base)(parsed);
  // Installed before the setup screen existed: they've already set things up.
  if (stored && parsed.onboarded === undefined) {
    next.onboarded = true;
  }
  if (REMOVED_SOUNDS.includes(next.sound)) {
    next.sound = 'mecca';
  }
  // Saved before city names existed: don't show the default city for it.
  return parsed.location && !parsed.city ? {...next, city: undefined} : next;
};

/** Read the saved settings outside React (the background task). */
export const loadSettings = async (): Promise<Settings> =>
  parseSettings(await AsyncStorage.getItem(SETTINGS_KEY));
