type Location = {
  lat: number;
  lng: number;
};

type PrayerTimeLabel = {
  label: string;
  time: Date;
};

type PrayerCalculationMethod =
  | 'MWL'
  | 'ISNA'
  | 'Egypt'
  | 'Makkah'
  | 'Karachi'
  | 'Tehran'
  | 'Jafari';

type AsrJuristics = 'Hanafi' | 'Standard';
type FajrIshaCalculation = 'Standard' | '90mins';

type Settings = {
  location: Location;
  asr: AsrJuristics;
  fajrIshaCalculation: FajrIshaCalculation;
  calculationMethod: PrayerCalculationMethod;
  sound: string;
};

type SettingKey =
  | 'location'
  | 'asr'
  | 'fajr'
  | 'fajrFromSunrise'
  | 'calculationMethod';

type Adjustment = Record<string, number>;

declare module 'react-native-push-notification';
declare module 'react-native-vector-icons/Ionicons';

type PrayerTimesByDate = Record<string, PrayerTimeLabel[]>;

type Sounds = Record<string, {name: string; path: string}> | undefined | null;
type SettingScreenMap = Record<string, string>;
type NotificationChannels = Record<
  string,
  {channelId: string; soundName: string}
>;

type ColorScheme = 'light' | 'dark' | 'system' | undefined | null;

interface AppSettingsContextInterface {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  setSetting: (key: string) => (value: any) => void;
  getPrayerTimes: (date?: Date) => PrayerTimeLabel[];
  calculationMethod: () => string;
  today: number;
}

interface SettingsTitleInterface {
  setting: string;
  selected?: string;
  setSetting?: (setting: string) => void;
}

interface SelectListInterface {
  items: string[];
  selected: string;
  onSelect: (value: any) => void;
}
