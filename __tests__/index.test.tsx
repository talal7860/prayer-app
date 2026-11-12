import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import App from '../App';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('expo-notifications', () => ({
  setNotificationChannelAsync: jest.fn(() => Promise.resolve(null)),
  getPermissionsAsync: jest.fn(() => Promise.resolve({granted: true})),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({granted: true})),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('id')),
  AndroidImportance: {HIGH: 4},
  SchedulableTriggerInputTypes: {DATE: 'date'},
}));

it('renders Today and schedules reminders, with Sunrise muted by default', async () => {
  await render(<App />);
  expect(await screen.findAllByText(/fajr/i)).not.toHaveLength(0);
  expect(screen.getByLabelText('Turn on Sunrise reminder')).toBeTruthy();
  await waitFor(() =>
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled(),
  );
  const titles = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.map(
    ([request]) => request.content.title,
  );
  expect(titles.some((title: string) => title.includes('Sunrise'))).toBe(false);
});

it('switches to Week and Settings', async () => {
  await render(<App />);
  await fireEvent.press(await screen.findByRole('button', {name: /^Week/}));
  expect(await screen.findByText('Next week')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', {name: /^Settings/}));
  expect(await screen.findByText('Heads-up reminder')).toBeTruthy();
});
