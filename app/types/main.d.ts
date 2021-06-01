type Location = {
  lat: number;
  lng: number;
};

type PrayerTimeLabel = {
  label: string;
  time: Date;
};

type Adjustment = Record<string, number>;

declare module 'react-native-push-notification';
