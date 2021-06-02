import {useCallback, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {isEqual, merge} from 'lodash/fp';
import PrayerTimes from '../lib/PrayTimes';

const settingskey = '@prayer_app:settings';

const defaultSettings: Settings = Object.freeze({
  location: {
    // default is calgary
    lat: 51.05011,
    lng: -114.08529,
  },
  calculationMethod: 'Karachi',
  isha: '90 min',
  fajrFromSunrise: '-90 min',
  fajr: '',
  asr: 'Hanafi',
});

const prayerLabels: Record<string, string> = Object.freeze({
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
});

const persist = async (settings: any) => {
  try {
    return AsyncStorage.setItem(settingskey, JSON.stringify(settings));
  } catch (error) {
    console.error(error.message);
  }
};

const getSettings = async () => {
  const value = await AsyncStorage.getItem(settingskey);
  return value != null ? JSON.parse(value) : {};
};

const useAppSettings = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    if (!settings || isEqual(defaultSettings)(settings)) {
      return;
    }
    persist(settings);
  }, [settings]);

  useEffect(() => {
    async function process() {
      const stored = await getSettings();
      setSettings((prev: Settings) => merge(prev)(stored));
    }
    process();
  }, []);

  const getPrayerTimes = useCallback(
    (date: Date = new Date()): PrayerTimeLabel[] => {
      const PT = new PrayerTimes(settings.method);
      PT.adjust(settings);
      const times = PT.getTimes(
        date,
        [settings.location.lat, settings.location.lng],
        -date.getTimezoneOffset() / 60,
        0,
        '24h',
      );
      return Object.keys(prayerLabels).map(prayer => {
        const prayerDate = new Date(date.getTime());
        const time = times[prayer].split(':');
        prayerDate.setHours(time[0]);
        prayerDate.setMinutes(time[1]);
        prayerDate.setSeconds(0);
        return {
          label: prayerLabels[prayer],
          time: prayerDate,
        };
      });
    },
    [settings],
  );

  return {
    settings,
    setSettings,
    getPrayerTimes,
  };
};

export default useAppSettings;
