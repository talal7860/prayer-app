import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react-native';
import SoundScreen from '../app/screens/SettingsScreen/Sound';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockSet = jest.fn();
jest.mock('../app/hooks/useAppSettings', () => () => ({
  settings: {sound: 'mecca', fajrAdhan: true},
  setSetting: (key: string) => (value: unknown) => mockSet(key, value),
}));

const player = (require('expo-audio') as {__player: Record<string, jest.Mock>}).__player;

beforeEach(() => {
  mockSet.mockClear();
  Object.values(player).forEach(fn => fn.mockClear());
});

it('lists Makkah, Madinah, Al-Aqsa and Default, and only those', async () => {
  await render(<SoundScreen />);
  expect(screen.getByRole('radio', {name: /Makkah/})).toBeSelected();
  for (const name of ['Madinah', 'Al-Aqsa', 'Default']) {
    expect(screen.getByRole('radio', {name: new RegExp(name)})).toBeTruthy();
  }
  expect(screen.getAllByRole('radio')).toHaveLength(4);
  expect(screen.queryByText(/Istanbul|Konya|Casablanca|Tripoli|Isfahan|Aaqib/)).toBeNull();
});

it('plays an adhan as soon as it is chosen', async () => {
  await render(<SoundScreen />);
  await fireEvent.press(screen.getByRole('radio', {name: /Madinah/}));
  expect(mockSet).toHaveBeenCalledWith('sound', 'madinah');
  expect(player.replace).toHaveBeenCalledTimes(1);
  expect(player.play).toHaveBeenCalledTimes(1);
});

it('choosing Default plays nothing and stops a preview', async () => {
  await render(<SoundScreen />);
  await fireEvent.press(screen.getByRole('radio', {name: /Default/}));
  expect(mockSet).toHaveBeenCalledWith('sound', 'default');
  expect(player.play).not.toHaveBeenCalled();
  expect(player.pause).toHaveBeenCalled();
});

it('keeps the Fajr adhan switch with its own preview, and credits the recordings', async () => {
  await render(<SoundScreen />);
  await fireEvent.press(screen.getByRole('switch', {name: 'Fajr adhan at Fajr'}));
  expect(mockSet).toHaveBeenCalledWith('fajrAdhan', false);
  await fireEvent.press(screen.getByRole('button', {name: 'Play Fajr adhan at Fajr'}));
  expect(player.play).toHaveBeenCalled();
  expect(screen.getByText(/assabile\.com/)).toBeTruthy();
});
