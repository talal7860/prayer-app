import AsyncStorage from '@react-native-async-storage/async-storage';
import {merge} from 'lodash/fp';

export const SETTINGS_KEY = '@prayer_app:settings';
/**
 * Saved with the settings, for changes an old value can't tell apart. 2: Sunrise got a bell
 * (Nov 2026). Before it Sunrise was never notified, whatever `muted.sunrise` said.
 */
export const SETTINGS_VERSION = 2;

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
  // Sunrise's bell is off until someone turns it on.
  muted: {sunrise: true},
  adjustments: {},
  endsSoon: false,
  // Opt-in: off until someone turns it on (setup or Settings → Notifications).
  liveActivity: false,
  timeFormat: '12h',
  highLats: 'NightMiddle',
  onboarded: false,
  version: SETTINGS_VERSION,
});

/** Adhan sounds that were removed; a saved one goes back to Makkah. */
const REMOVED_SOUNDS = ['istanbul', 'konya', 'casablanca', 'tripoli', 'isfahan', 'azeez'];

/** What may be saved: any subset of the settings, plus keys from older versions. */
type StoredSettings = Partial<Settings> & {
  fajrIshaCalculation?: string;
  travelAlerts?: boolean;
  headsUp?: boolean;
};

/** Saved settings on top of `base`, with old keys dropped. */
export const parseSettings = (
  stored: string | null,
  base: Settings = defaultSettings,
): Settings => {
  // Removed settings, dropped if saved: `fajrIshaCalculation` (the old 90-minute rule),
  // `travelAlerts` (background "Always" location) and `headsUp` (10 minutes before each prayer,
  // replaced by `endsSoon`: someone who had it on gets the new reminder).
  const {
    fajrIshaCalculation: _removed,
    travelAlerts: _travel,
    headsUp,
    ...parsed
  } = stored ? (JSON.parse(stored) as StoredSettings) : {};
  const next: Settings = merge(base)(parsed);
  // Installed before the setup screen existed: they've already set things up.
  if (stored && parsed.onboarded === undefined) {
    next.onboarded = true;
  }
  if (parsed.endsSoon === undefined && headsUp) {
    next.endsSoon = true;
  }
  // Saved before Sunrise had a bell: keep it silent, as it was, whatever was saved for it.
  if (stored && (parsed.version ?? 1) < 2) {
    next.muted = {...next.muted, sunrise: true};
  }
  next.version = SETTINGS_VERSION;
  if (REMOVED_SOUNDS.includes(next.sound)) {
    next.sound = 'mecca';
  }
  // Saved before city names existed: don't show the default city for it.
  return parsed.location && !parsed.city ? {...next, city: undefined} : next;
};

/** Read the saved settings outside React (the background task). */
export const loadSettings = async (): Promise<Settings> =>
  parseSettings(await AsyncStorage.getItem(SETTINGS_KEY));
