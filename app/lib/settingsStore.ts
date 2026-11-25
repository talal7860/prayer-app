import AsyncStorage from '@react-native-async-storage/async-storage';
import {merge} from 'lodash/fp';
import {getCloudValue, setCloudValue} from '../../modules/icloud-settings';

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

/** The key of the settings' copy in iCloud key-value storage (iOS). */
export const CLOUD_SETTINGS_KEY = 'settings';

/**
 * The settings saved in iCloud, if they're from a finished setup. Null without iCloud (Android,
 * Jest, signed out, not downloaded yet) or if what's there isn't usable.
 */
export const cloudSettings = (): string | null => {
  const stored = getCloudValue(CLOUD_SETTINGS_KEY);
  if (!stored) {
    return null;
  }
  try {
    const parsed = JSON.parse(stored) as StoredSettings | null;
    return parsed?.onboarded === true ? stored : null;
  } catch {
    return null;
  }
};

/** Keep a copy in iCloud, once the setup is done (a half-done setup isn't worth restoring). */
export const saveCloudSettings = (settings: Settings) => {
  if (settings.onboarded) {
    setCloudValue(CLOUD_SETTINGS_KEY, JSON.stringify(settings));
  }
};

/**
 * The settings JSON to start from: this device's, else (a fresh install, a new iPhone) the copy
 * in iCloud. This device's always wins when there is one. Goes through `parseSettings` like any
 * saved settings, so a copy from an older version is migrated too.
 */
export const readStoredSettings = async (): Promise<string | null> =>
  (await AsyncStorage.getItem(SETTINGS_KEY).catch(() => null)) ?? cloudSettings();

/** Read the saved settings outside React (the background task). */
export const loadSettings = async (): Promise<Settings> =>
  parseSettings(await readStoredSettings());
