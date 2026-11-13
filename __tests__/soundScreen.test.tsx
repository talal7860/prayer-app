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

it('lists the adhans, previews one, and picks one', async () => {
  await render(<SoundScreen />);
  expect(screen.getByRole('radio', {name: /Makkah/})).toBeSelected();
  for (const name of [
    'Istanbul, Turkey',
    'Casablanca, Morocco',
    'Tripoli, Lebanon',
    'Aaqib Azeez',
  ]) {
    expect(screen.getByText(name)).toBeTruthy();
  }

  await fireEvent.press(screen.getByRole('button', {name: 'Play Istanbul, Turkey'}));
  expect(player.replace).toHaveBeenCalledTimes(1);
  expect(player.play).toHaveBeenCalledTimes(1);
  // Previewing doesn't change the chosen sound.
  expect(mockSet).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByText('Konya, Turkey'));
  expect(mockSet).toHaveBeenCalledWith('sound', 'konya');
});

it('has the Fajr adhan switch, with its own preview, and credits the recordings', async () => {
  await render(<SoundScreen />);
  await fireEvent.press(screen.getByRole('switch', {name: 'Fajr adhan at Fajr'}));
  expect(mockSet).toHaveBeenCalledWith('fajrAdhan', false);
  await fireEvent.press(screen.getByRole('button', {name: 'Play Fajr adhan at Fajr'}));
  expect(player.play).toHaveBeenCalled();
  expect(screen.getByText(/Wikimedia Commons/)).toBeTruthy();
});
