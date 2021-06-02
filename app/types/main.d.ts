type Location = {
  lat: number;
  lng: number;
};

type PrayerTimeLabel = {
  label: string;
  time: Date;
};

type Settings = {
  location: Location;
  asr: string;
  fajr: string;
  fajrFromSunrise: string;
  calculationMethod: string;
};

type SettingKey =
  | 'location'
  | 'asr'
  | 'fajr'
  | 'fajrFromSunrise'
  | 'calculationMethod';

type Adjustment = Record<string, number>;

declare module 'react-native-push-notification';
