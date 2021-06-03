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
  fajr: string;
  fajrIshaCalculation: FajrIshaCalculation;
  calculationMethod: PrayerCalculationMethod;
};

type SettingKey =
  | 'location'
  | 'asr'
  | 'fajr'
  | 'fajrFromSunrise'
  | 'calculationMethod';

type Adjustment = Record<string, number>;

declare module 'react-native-push-notification';

type PrayerTimesByDate = Record<string, PrayerTimeLabel[]>;
