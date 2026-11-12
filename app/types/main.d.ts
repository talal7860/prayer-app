type GeoLocation = {
  lat: number;
  lng: number;
};

type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

type PrayerTimeLabel = {
  key: PrayerKey;
  label: string;
  time: Date;
};

type PrayerCalculationMethod =
  'MWL' | 'ISNA' | 'Egypt' | 'Makkah' | 'Karachi' | 'Tehran' | 'Jafari';

type AsrJuristics = 'Hanafi' | 'Standard';

type TimeFormat = '12h' | '24h';

/** How Fajr and Isha are set where twilight doesn't end (high latitudes in summer). */
type HighLatRule = 'NightMiddle' | 'AngleBased' | 'OneSeventh';

type Settings = {
  location: GeoLocation;
  /** Display name for `location`, e.g. "Calgary, AB". From reverse geocoding. */
  city?: string;
  asr: AsrJuristics;
  calculationMethod: PrayerCalculationMethod;
  sound: string;
  /** Prayers whose reminder bell is off. */
  muted: Partial<Record<PrayerKey, boolean>>;
  /** Minutes added to each calculated time (negative = earlier), to match the local mosque. */
  adjustments: Partial<Record<PrayerKey, number>>;
  /** Opt-in: watch for travel in the background and notify ("Always" location permission). */
  travelAlerts: boolean;
  /** Extra reminder 10 minutes before each prayer. */
  headsUp: boolean;
  /** iOS: the Live Activity countdown (lock screen and Dynamic Island) before each prayer. */
  liveActivity: boolean;
  timeFormat: TimeFormat;
  highLats: HighLatRule;
  /** The first-run setup was finished. Saved settings from before it existed count as done. */
  onboarded: boolean;
  /** Location (rounded) the user chose to keep when the travel prompt showed. */
  travelDismissedAt?: GeoLocation;
};

type SettingKey = 'location' | 'asr' | 'fajr' | 'fajrFromSunrise' | 'calculationMethod';

type Adjustment = Record<string, number>;

type PrayerTimesByDate = Record<string, PrayerTimeLabel[]>;

type Sounds = Record<string, {name: string; path: string}> | undefined | null;
type SettingScreenMap = Record<string, string>;
type NotificationChannels = Record<string, {channelId: string; soundName: string}>;

type ColorScheme = 'light' | 'dark' | 'system' | undefined | null;

interface AppSettingsContextInterface {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  setSetting: (key: string) => (value: any) => void;
  getPrayerTimes: (date?: Date) => PrayerTimeLabel[];
  calculationMethod: () => string;
  today: number;
  /** The saved settings have been read. Until then `settings` are the defaults. */
  loaded: boolean;
}

interface SettingsTitleInterface {
  setting: string;
  selected?: string;
  setSetting?: (setting: string) => void;
}
