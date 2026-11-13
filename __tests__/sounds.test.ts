jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AppConstants from '../app/AppConstants';
import {defaultSettings} from '../app/lib/settingsStore';

const app = require('../app.json') as {expo: {plugins: unknown[]}};

it('bundles every sound file with expo-notifications, and gives each its own channel', () => {
  const plugin = app.expo.plugins.find(p => Array.isArray(p) && p[0] === 'expo-notifications') as [
    string,
    {sounds: string[]},
  ];
  const bundled = plugin[1].sounds.map(s => s.split('/').pop());
  const files = Object.values(AppConstants.notificationChannels)
    .map(c => c.soundName)
    .filter(s => s !== 'default');
  expect(new Set(bundled)).toEqual(new Set(files));
  const ids = Object.values(AppConstants.notificationChannels).map(c => c.channelId);
  expect(new Set(ids).size).toBe(ids.length);
});

it('plays the Fajr adhan at Fajr when on, the chosen sound otherwise', () => {
  const s = {...defaultSettings, sound: 'istanbul'};
  expect(defaultSettings.fajrAdhan).toBe(true);
  expect(AppConstants.adhanChannel(s, 'fajr').soundName).toBe('adhan_fajr.wav');
  expect(AppConstants.adhanChannel(s, 'dhuhr').soundName).toBe('adhan_istanbul.wav');
  expect(AppConstants.adhanChannel({...s, fajrAdhan: false}, 'fajr').soundName).toBe(
    'adhan_istanbul.wav',
  );
  // The system default sound stays the default at Fajr too.
  expect(AppConstants.adhanChannel({...s, sound: 'default'}, 'fajr').channelId).toBe(
    'prayer-time-notifications',
  );
  // A sound key this version doesn't have falls back to Makkah.
  expect(AppConstants.adhanChannel({...s, sound: 'gone'}, 'asr').channelId).toBe('adhan-makkah-v2');
});
