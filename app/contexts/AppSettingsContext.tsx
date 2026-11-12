import React, {
  useCallback,
  useEffect,
  useState,
  createContext,
  FC,
  PropsWithChildren,
} from 'react';
import {useAsyncStorage} from '@react-native-async-storage/async-storage';
import {merge} from 'lodash/fp';
import MyDate from '../lib/MyDate';
import {methodName, prayerTimesFor} from '../lib/prayerTimes';
import {
  SETTINGS_KEY,
  defaultSettings,
  parseSettings,
} from '../lib/settingsStore';

const AppSettingsContext = createContext<AppSettingsContextInterface>({
  settings: defaultSettings,
  setSettings: () => {},
  setSetting: () => () => {},
  getPrayerTimes: (_date?: Date | undefined) => [],
  calculationMethod: () => '',
  today: new MyDate().beginningOfDay().getTime(),
  loaded: false,
});

const AppSettingsProvider: FC<PropsWithChildren> = ({children}) => {
  const [today, setToday] = useState(new MyDate().beginningOfDay().getTime());
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  // Don't save until the stored settings are read, or the defaults would overwrite them.
  const [loaded, setLoaded] = useState(false);
  const {getItem, setItem} = useAsyncStorage(SETTINGS_KEY);
  useEffect(() => {
    if (loaded) {
      setItem(JSON.stringify(settings));
    }
  }, [setItem, settings, loaded]);

  useEffect(() => {
    const interval = setInterval(() => {
      setToday(new MyDate().beginningOfDay().getTime());
    }, 1000 * 60);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function process() {
      const stored = await getItem().catch(() => null);
      setSettings((prev: Settings) => parseSettings(stored, prev));
      setLoaded(true);
    }
    process();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculationMethod = () => methodName(settings.calculationMethod);

  const setSetting = (key: string) => (value: any) =>
    setSettings((prev: Settings) => merge(prev)({[key]: value}));

  const settingsKey = JSON.stringify(settings);
  const getPrayerTimes = useCallback(
    (date: Date = new Date()): PrayerTimeLabel[] => prayerTimesFor(settings, date),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settingsKey],
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
        loaded,
      }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export {AppSettingsProvider};

export default AppSettingsContext;
