import React from 'react';
import {act, render, screen} from '@testing-library/react-native';
import * as ExpoLocation from 'expo-location';
import * as Haptics from 'expo-haptics';
import QiblaScreen from '../app/screens/QiblaScreen';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('../app/hooks/useAppSettings', () => () => ({
  settings: {location: {lat: 51.05, lng: -114.07}, city: 'Calgary, AB'},
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {Light: 'light'},
}));

let onHeading: (h: {trueHeading: number; magHeading: number; accuracy: number}) => void;
let onError: () => void;
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  watchHeadingAsync: jest.fn((cb, err) => {
    onHeading = cb;
    onError = err;
    return Promise.resolve({remove: jest.fn()});
  }),
}));

const granted = (yes: boolean) =>
  (ExpoLocation.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
    granted: yes,
    canAskAgain: true,
  });

it('shows the bearing and distance, and asks for location when it is off', async () => {
  granted(false);
  await render(<QiblaScreen />);
  expect(await screen.findByText('Location is off')).toBeTruthy();
  expect(screen.getByText('25° from north')).toBeTruthy();
  expect(screen.getByText('11,561 km')).toBeTruthy();
  expect(screen.getByText('Allow location')).toBeTruthy();
});

it('says so when there is no compass', async () => {
  granted(true);
  await render(<QiblaScreen />);
  await act(async () => onError());
  expect(screen.getByText('No compass on this device')).toBeTruthy();
  expect(screen.getByText(/Face 25° from north/)).toBeTruthy();
});

it('tells you which way to turn, then that you are facing the qibla', async () => {
  granted(true);
  await render(<QiblaScreen />);
  await act(async () => onHeading({trueHeading: 0, magHeading: 10, accuracy: 3}));
  expect(screen.getByText('Turn right 25°')).toBeTruthy();
  await act(async () => onHeading({trueHeading: 60, magHeading: 70, accuracy: 3}));
  expect(screen.getByText('Turn left 35°')).toBeTruthy();
  expect(Haptics.impactAsync).not.toHaveBeenCalled();
  await act(async () => onHeading({trueHeading: 22, magHeading: 30, accuracy: 3}));
  expect(screen.getByText('You’re facing the qibla')).toBeTruthy();
  expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
  // Hysteresis: 7° off still counts once facing.
  await act(async () => onHeading({trueHeading: 18, magHeading: 30, accuracy: 3}));
  expect(screen.getByText('You’re facing the qibla')).toBeTruthy();
  // One tap per time you line up, not one per compass reading.
  expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
});

it('asks to calibrate when accuracy is low', async () => {
  (Haptics.impactAsync as jest.Mock).mockClear();
  granted(true);
  await render(<QiblaScreen />);
  await act(async () => onHeading({trueHeading: -1, magHeading: 25, accuracy: 1}));
  expect(screen.getByText('Compass needs calibrating')).toBeTruthy();
  expect(screen.getByText('You’re facing the qibla')).toBeTruthy();
});
