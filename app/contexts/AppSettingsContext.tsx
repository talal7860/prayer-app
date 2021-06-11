import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  createContext,
  FC,
} from 'react';
import {useAsyncStorage} from '@react-native-async-storage/async-storage';
import {isEqual, merge} from 'lodash/fp';
import PrayerTimes from '../lib/PrayTimes';
import I18n from '../I18n';
import MyDate from '../lib/MyDate';

const settingskey = '@prayer_app:settings';

const defaultSettings: Settings = Object.freeze({
  location: {
    // default is calgary
    lat: 51.05011,
    lng: -114.08529,
  },
  calculationMethod: 'Karachi',
  fajrIshaCalculation: '90mins',
  fajr: '',
  asr: 'Hanafi',
  sound: 'mecca',
});

const AppSettingsContext = createContext<AppSettingsContextInterface>({
  settings: defaultSettings,
  setSettings: () => {},
  getPrayerTimes: (_date?: Date | undefined) => [{label: '', time: new Date()}],
  calculationMethod: () => '',
  today: new MyDate().beginningOfDay().getTime(),
});

const prayers = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const AppSettingsProvider: FC = ({children}) => {
  const [today, setToday] = useState(new MyDate().beginningOfDay().getTime());
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const {getItem, setItem} = useAsyncStorage(settingskey);
  const PT = useMemo(
    //@ts-ignore
    () => new PrayerTimes(settings.calculationMethod),
    [settings.calculationMethod],
  );
  useEffect(() => {
    if (!settings || isEqual(defaultSettings)(settings)) {
      return;
    }
    setItem(JSON.stringify(settings));
  }, [setItem, settings]);

  useEffect(() => {
    const interval = setInterval(() => {
      setToday(new MyDate().beginningOfDay().getTime());
    }, 1000 * 60);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function process() {
      const stored = await getItem();
      setSettings((prev: Settings) =>
        merge(prev)(stored ? JSON.parse(stored) : {}),
      );
    }
    process();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculationMethod = () =>
    PT.getDefaults()[settings.calculationMethod].name;

  const getPrayerTimes = useCallback(
    (date: Date = new Date()): PrayerTimeLabel[] => {
      PT.adjust(settings);
      const times = PT.getTimes(
        new Date(date),
        [settings.location.lat, settings.location.lng],
        -date.getTimezoneOffset() / 60,
        0,
        '24h',
      );
      return prayers.map(prayer => {
        const prayerDate = new Date(date.getTime());
        const time = times[prayer].split(':');
        prayerDate.setHours(time[0]);
        prayerDate.setMinutes(time[1]);
        prayerDate.setSeconds(0);
        return {
          label: I18n.t(`prayer.${prayer}`),
          time: prayerDate,
        };
      });
    },
    [PT, settings],
  );
  return (
    <AppSettingsContext.Provider
      value={{
        settings,
        setSettings,
        getPrayerTimes,
        calculationMethod,
        today,
      }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export {AppSettingsProvider};

export default AppSettingsContext;
