jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../modules/icloud-settings');

import AsyncStorage from '@react-native-async-storage/async-storage';
import type * as CloudMock from '../modules/icloud-settings/__mocks__';
// The in-memory store in modules/icloud-settings/__mocks__.
const {cloudStore, resetCloud, setCloudValue} = jest.requireMock<typeof CloudMock>(
  '../modules/icloud-settings',
);
import {
  CLOUD_SETTINGS_KEY,
  SETTINGS_KEY,
  cloudSettings,
  defaultSettings,
  loadSettings,
  readStoredSettings,
  saveCloudSettings,
} from '../app/lib/settingsStore';

beforeEach(async () => {
  await AsyncStorage.clear();
  resetCloud();
  jest.clearAllMocks();
});

const islamabad = {
  ...defaultSettings,
  onboarded: true,
  city: 'Islamabad, PK',
  location: {lat: 33.6844, lng: 73.0479},
  calculationMethod: 'ISNA' as const,
};

it('restores the iCloud copy when this device has none (a reinstall)', async () => {
  cloudStore.set(CLOUD_SETTINGS_KEY, JSON.stringify(islamabad));
  expect(await loadSettings()).toMatchObject({
    onboarded: true,
    city: 'Islamabad, PK',
    calculationMethod: 'ISNA',
  });
});

it("keeps this device's settings when both exist", async () => {
  cloudStore.set(CLOUD_SETTINGS_KEY, JSON.stringify(islamabad));
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({onboarded: true, city: 'Calgary, AB'}));
  expect(await loadSettings()).toMatchObject({city: 'Calgary, AB', calculationMethod: 'Karachi'});
});

it('migrates a restored copy like any saved settings', async () => {
  // Saved by an older version: the 10-minute reminder, a removed sound, no `version`.
  cloudStore.set(
    CLOUD_SETTINGS_KEY,
    JSON.stringify({
      onboarded: true,
      headsUp: true,
      sound: 'istanbul',
      fajrIshaCalculation: '90mins',
      muted: {sunrise: false},
    }),
  );
  const settings = await loadSettings();
  expect(settings).toMatchObject({endsSoon: true, sound: 'mecca', version: 2});
  expect(settings.muted.sunrise).toBe(true);
  expect(settings).not.toHaveProperty('headsUp');
  expect(settings).not.toHaveProperty('fajrIshaCalculation');
});

it("ignores a copy from a setup that wasn't finished, or that can't be read", async () => {
  cloudStore.set(CLOUD_SETTINGS_KEY, JSON.stringify({...islamabad, onboarded: false}));
  expect(cloudSettings()).toBeNull();
  cloudStore.set(CLOUD_SETTINGS_KEY, '{not json');
  expect(cloudSettings()).toBeNull();
  expect(await readStoredSettings()).toBeNull();
  expect((await loadSettings()).onboarded).toBe(false);
});

it('saves to iCloud only once the setup is done', () => {
  saveCloudSettings(defaultSettings);
  expect(setCloudValue).not.toHaveBeenCalled();
  saveCloudSettings(islamabad);
  expect(JSON.parse(cloudStore.get(CLOUD_SETTINGS_KEY)!)).toEqual(islamabad);
});
