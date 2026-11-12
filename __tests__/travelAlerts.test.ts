jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-task-manager', () => ({defineTask: jest.fn()}));
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('id')),
}));
const here = {lat: 53.55, lng: -113.49}; // Edmonton
jest.mock('expo-location', () => ({
  getLastKnownPositionAsync: jest.fn(() =>
    Promise.resolve({coords: {latitude: here.lat, longitude: here.lng}}),
  ),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(() =>
    Promise.resolve([{city: 'Edmonton', region: 'AB', isoCountryCode: 'CA'}]),
  ),
  GeofencingEventType: {Exit: 2},
  Accuracy: {Low: 2},
}));

import * as Notifications from 'expo-notifications';
import {checkTravel} from '../app/travelTask';
import {defaultSettings} from '../app/lib/settingsStore';

const calgary: Settings = {...defaultSettings, travelAlerts: true};

it('tells the user once per new place, not on every check', async () => {
  await expect(checkTravel(calgary)).resolves.toBe(true);
  expect(
    (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0].content.title,
  ).toBe("You're in Edmonton");
  // The next periodic check in the same place stays quiet.
  await expect(checkTravel(calgary)).resolves.toBe(false);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
});

it('stays quiet at the saved location', async () => {
  await expect(checkTravel({...calgary, location: here})).resolves.toBe(false);
});
