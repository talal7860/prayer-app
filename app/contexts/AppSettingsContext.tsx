import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  createContext,
  FC,
  PropsWithChildren,
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
  city: 'Calgary, AB',
  calculationMethod: 'Karachi',
  asr: 'Hanafi',
  sound: 'mecca',
  muted: {sunrise: true},
  headsUp: false,
  timeFormat: '12h',
});

const AppSettingsContext = createContext<AppSettingsContextInterface>({
  settings: defaultSettings,
  setSettings: () => {},
  setSetting: () => () => {},
  getPrayerTimes: (_date?: Date | undefined) => [],
  calculationMethod: () => '',
  today: new MyDate().beginningOfDay().getTime(),
});

const prayers: PrayerKey[] = [
  'fajr',
  'sunrise',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

const AppSettingsProvider: FC<PropsWithChildren> = ({children}) => {
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
      // `fajrIshaCalculation` (the old 90-minute rule) was removed; drop it if saved.
      const {fajrIshaCalculation: _removed, ...parsed}: Partial<Settings> & {
        fajrIshaCalculation?: string;
      } = stored ? JSON.parse(stored) : {};
      setSettings((prev: Settings) => {
        const next: Settings = merge(prev)(parsed);
        // Saved before city names existed: don't show the default city for it.
        return parsed.location && !parsed.city ? {...next, city: undefined} : next;
      });
    }
    process();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculationMethod = () =>
    PT.getDefaults()[settings.calculationMethod].name;

  const setSetting = (key: string) => (value: any) =>
    setSettings((prev: Settings) => merge(prev)({[key]: value}));

  const settingsKey = JSON.stringify(settings);
  const getPrayerTimes = useCallback(
    (date: Date = new Date()): PrayerTimeLabel[] => {
      // Reset to the method's own parameters, then apply the user's choices.
      PT.setMethod(settings.calculationMethod);
      PT.adjust({asr: settings.asr});
      const times = PT.getTimes(
        date,
        [settings.location.lat, settings.location.lng],
        -date.getTimezoneOffset() / 60,
        0,
        '24h',
      );
      return prayers.map(prayer => {
        const prayerDate = new Date(date);
        const [hours, minutes] = times[prayer].split(':').map(Number);
        prayerDate.setHours(hours, minutes, 0, 0);
        const label =
          prayer === 'dhuhr' && prayerDate.getDay() === 5
            ? I18n.t('prayer.jumuah')
            : I18n.t(`prayer.${prayer}`);
        return {key: prayer, label, time: prayerDate};
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [PT, settingsKey],
  );
  return (
    <AppSettingsContext.Provider
      value={{
        settings,
        setSettings,
        setSetting,
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
