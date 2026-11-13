import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Dimensions} from 'react-native';
import App from '../App';
import {SETTINGS_KEY} from '../app/lib/settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('expo-notifications', () => ({
  setNotificationChannelAsync: jest.fn(() => Promise.resolve(null)),
  deleteNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getPermissionsAsync: jest.fn(() => Promise.resolve({granted: true})),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({granted: true})),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('id')),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  AndroidImportance: {HIGH: 4},
  AndroidAudioUsage: {NOTIFICATION: 5},
  AndroidAudioContentType: {SONIFICATION: 4},
  SchedulableTriggerInputTypes: {DATE: 'date'},
}));

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn(() => Promise.resolve(false)),
}));

jest.mock('expo-background-task', () => ({
  registerTaskAsync: jest.fn(() => Promise.resolve()),
  BackgroundTaskResult: {Success: 1, Failed: 2},
}));

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({granted: false, canAskAgain: true}),
  ),
  watchHeadingAsync: jest.fn(() => Promise.resolve({remove: jest.fn()})),
  geocodeAsync: jest.fn(() => Promise.resolve([{latitude: 33.6844, longitude: 73.0479}])),
  reverseGeocodeAsync: jest.fn(() =>
    Promise.resolve([
      {
        city: 'Islamabad',
        region: 'Islamabad Capital Territory',
        isoCountryCode: 'PK',
        country: 'Pakistan',
      },
    ]),
  ),
}));

const savedSetup = () => AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({onboarded: true}));

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('first run', () => {
  it('shows the setup, preselects what is common there, and saves on Start', async () => {
    await render(<App />);
    expect(await screen.findByText('Where are you?')).toBeTruthy();
    // No location yet: can't continue, and no permission prompt over the setup.
    expect(screen.getByRole('button', {name: 'Continue'})).toBeDisabled();
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText('Or type a city'), 'Islamabad');
    await fireEvent.press(screen.getByRole('button', {name: 'Search'}));
    expect(await screen.findByText('Islamabad, PK')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', {name: 'Continue'}));

    expect(await screen.findByText('Common in Pakistan')).toBeTruthy();
    expect(screen.getByRole('radio', {name: /Karachi/})).toBeSelected();
    await fireEvent.press(screen.getByRole('button', {name: 'Continue'}));

    expect(screen.getByRole('radio', {name: /^Hanafi/})).toBeSelected();
    await fireEvent.press(screen.getByRole('radio', {name: /^Standard/}));
    // 33.7° N is not a high latitude, so the next step is the review.
    await fireEvent.press(screen.getByRole('button', {name: 'Continue'}));
    expect(await screen.findByText('Your prayer times today')).toBeTruthy();
    // The Live Activity is opt-in: off until turned on here.
    const liveActivity = screen.getByRole('switch', {name: 'Live Activity'});
    expect(liveActivity).not.toBeChecked();
    await fireEvent.press(liveActivity);
    await fireEvent.press(screen.getByRole('button', {name: 'Start'}));

    expect(await screen.findByLabelText('Turn off Fajr reminder')).toBeTruthy();
    await waitFor(async () =>
      expect(JSON.parse((await AsyncStorage.getItem(SETTINGS_KEY))!)).toMatchObject({
        onboarded: true,
        city: 'Islamabad, PK',
        location: {lat: 33.6844, lng: 73.0479},
        calculationMethod: 'Karachi',
        asr: 'Standard',
        liveActivity: true,
      }),
    );
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled(); // already granted in the mock
    expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
  });

  it('asks about high latitudes far north', async () => {
    const ExpoLocation = require('expo-location');
    ExpoLocation.geocodeAsync.mockResolvedValueOnce([{latitude: 51.05, longitude: -114.08}]);
    ExpoLocation.reverseGeocodeAsync.mockResolvedValueOnce([
      {city: 'Calgary', region: 'AB', isoCountryCode: 'CA', country: 'Canada'},
    ]);
    await render(<App />);
    await fireEvent.changeText(await screen.findByLabelText('Or type a city'), 'Calgary');
    await fireEvent.press(screen.getByRole('button', {name: 'Search'}));
    await screen.findByText('Calgary, AB');
    await fireEvent.press(screen.getByRole('button', {name: 'Continue'}));
    expect(screen.getByRole('radio', {name: /ISNA/})).toBeSelected();
    await fireEvent.press(screen.getByRole('button', {name: 'Continue'}));
    await fireEvent.press(screen.getByRole('button', {name: 'Continue'}));
    expect(await screen.findByText('High latitudes')).toBeTruthy();
    expect(screen.getByRole('radio', {name: /Middle of the night/})).toBeSelected();
  });

  it('skips the setup for people who used the app before it existed', async () => {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({calculationMethod: 'ISNA'}));
    await render(<App />);
    expect(await screen.findByLabelText('Turn off Fajr reminder')).toBeTruthy();
  });
});

it('creates the adhan channel with audio attributes, and deletes the old silent one', async () => {
  const {Platform} = require('react-native');
  const os = Platform.OS;
  Platform.OS = 'android';
  await savedSetup();
  await render(<App />);
  await waitFor(() => {
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      'adhan-makkah-v2',
      expect.objectContaining({
        sound: 'makkah_azan.wav',
        audioAttributes: {usage: 5, contentType: 4},
      }),
    );
  });
  expect(Notifications.deleteNotificationChannelAsync).toHaveBeenCalledWith('adhan-makkah');
  // The system-default channel keeps the default sound and attributes.
  const defaults = (Notifications.setNotificationChannelAsync as jest.Mock).mock.calls.find(
    ([id]) => id === 'prayer-time-notifications',
  );
  expect(defaults?.[1]).not.toHaveProperty('audioAttributes');
  Platform.OS = os;
});

it('renders Today with the five prayers, and never schedules Sunrise', async () => {
  await savedSetup();
  await render(<App />);
  expect(await screen.findAllByText(/fajr/i)).not.toHaveLength(0);
  expect(screen.getByLabelText('Turn off Fajr reminder')).toBeTruthy();
  // Sunrise is on the sun arc, not in the list.
  expect(screen.queryByLabelText(/Sunrise reminder/)).toBeNull();
  await waitFor(() => expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled());
  const titles = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.map(
    ([request]) => request.content.title,
  );
  expect(titles.some((title: string) => title.includes('Sunrise'))).toBe(false);
  expect(require('expo-background-task').registerTaskAsync).toHaveBeenCalledWith(
    'reschedule-prayer-notifications',
    {minimumInterval: 720},
  );
});

describe('larger screens', () => {
  const windowOf = (width: number, height: number) =>
    jest.spyOn(Dimensions, 'get').mockReturnValue({width, height, scale: 2, fontScale: 1});
  afterEach(() => jest.restoreAllMocks());

  it('shows the iPad board: six cards, a This week link and a Settings button', async () => {
    windowOf(1194, 834);
    await savedSetup();
    await render(<App />);
    expect(await screen.findByLabelText('Turn off Fajr reminder')).toBeTruthy();
    expect(screen.getByText('Sunrise')).toBeTruthy();
    // Sunrise is never notified, so its card has no bell.
    expect(screen.queryByLabelText(/Sunrise reminder/)).toBeNull();
    expect(screen.getByText('NEXT')).toBeTruthy();
    await fireEvent.press(screen.getByRole('link', {name: 'This week'}));
    expect(await screen.findByText('Next week')).toBeTruthy();
  });

  it('shows the cover-screen board at foldable cover width', async () => {
    windowOf(480, 672);
    await savedSetup();
    await render(<App />);
    expect(await screen.findByLabelText('Turn off Isha reminder')).toBeTruthy();
    expect(screen.getByText('NEXT')).toBeTruthy();
    expect(screen.queryByRole('link', {name: 'This week'})).toBeNull();
  });
});

it('switches to Week and Settings', async () => {
  await savedSetup();
  await render(<App />);
  await fireEvent.press(await screen.findByRole('button', {name: /^Week/}));
  expect(await screen.findByText('Next week')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', {name: /^Settings/}));
  expect(await screen.findByText('Heads-up reminder')).toBeTruthy();
});

it('has a Qibla tab whose compass runs only while it is open', async () => {
  const ExpoLocation = require('expo-location');
  await savedSetup();
  await render(<App />);
  await screen.findByRole('button', {name: /^Qibla/});
  const remove = jest.fn();
  ExpoLocation.getForegroundPermissionsAsync.mockResolvedValue({granted: true, canAskAgain: true});
  ExpoLocation.watchHeadingAsync.mockResolvedValue({remove});

  await fireEvent.press(screen.getByRole('button', {name: /^Qibla/}));
  expect(await screen.findByText('Starting the compass…')).toBeTruthy();
  await waitFor(() => expect(ExpoLocation.watchHeadingAsync).toHaveBeenCalled());

  await fireEvent.press(screen.getByRole('button', {name: /^Today/}));
  await waitFor(() => expect(remove).toHaveBeenCalled());
  expect(screen.queryByText('Starting the compass…')).toBeNull();
});
