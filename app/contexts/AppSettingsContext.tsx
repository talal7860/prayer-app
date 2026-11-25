import React, {useCallback, useEffect, useState, createContext, FC, PropsWithChildren} from 'react';
import {useAsyncStorage} from '@react-native-async-storage/async-storage';
import {addCloudChangeListener} from '../../modules/icloud-settings';
import {merge} from 'lodash/fp';
import MyDate from '../lib/MyDate';
import {methodName, prayerTimesFor} from '../lib/prayerTimes';
import {
  CLOUD_SETTINGS_KEY,
  SETTINGS_KEY,
  cloudSettings,
  defaultSettings,
  parseSettings,
  readStoredSettings,
  saveCloudSettings,
} from '../lib/settingsStore';

const AppSettingsContext = createContext<AppSettingsContextInterface>({
  settings: defaultSettings,
  setSettings: () => {
    // No provider: nothing to update.
  },
  setSetting: () => () => {
    // No provider: nothing to update.
  },
  getPrayerTimes: (_date?: Date) => [],
  calculationMethod: () => '',
  today: new MyDate().beginningOfDay().getTime(),
  loaded: false,
});

const AppSettingsProvider: FC<PropsWithChildren> = ({children}) => {
  const [today, setToday] = useState(new MyDate().beginningOfDay().getTime());
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  // Don't save until the stored settings are read, or the defaults would overwrite them.
  const [loaded, setLoaded] = useState(false);
  const {setItem} = useAsyncStorage(SETTINGS_KEY);
  useEffect(() => {
    if (loaded) {
      void setItem(JSON.stringify(settings));
      saveCloudSettings(settings);
    }
  }, [setItem, settings, loaded]);

  // After a reinstall iCloud often hasn't downloaded the copy by launch. If it arrives while the
  // setup is still showing, use it. Once set up, this device's settings win and it isn't followed.
  const onboarded = settings.onboarded;
  useEffect(() => {
    if (!loaded || onboarded) {
      return;
    }
    const subscription = addCloudChangeListener(keys => {
      const stored = keys.includes(CLOUD_SETTINGS_KEY) ? cloudSettings() : null;
      if (stored) {
        setSettings(prev => (prev.onboarded ? prev : parseSettings(stored, prev)));
      }
    });
    return () => subscription?.remove();
  }, [loaded, onboarded]);

  useEffect(() => {
    const interval = setInterval(() => {
      setToday(new MyDate().beginningOfDay().getTime());
    }, 1000 * 60);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function process() {
      const stored = await readStoredSettings();
      setSettings((prev: Settings) => parseSettings(stored, prev));
      setLoaded(true);
    }
    // Once, on mount.
    void process();
  }, []);

  const calculationMethod = () => methodName(settings.calculationMethod);

  const setSetting = (key: string) => (value: unknown) =>
    setSettings((prev: Settings) => merge(prev)({[key]: value}));

  const settingsKey = JSON.stringify(settings);
  const getPrayerTimes = useCallback(
    (date: Date = new Date()): PrayerTimeLabel[] => prayerTimesFor(settings, date),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute when the settings' contents change, not their identity
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
