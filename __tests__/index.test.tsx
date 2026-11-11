import React from 'react';
import {render, screen} from '@testing-library/react-native';
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

it('renders the home screen', async () => {
  await render(<App />);
  expect(await screen.findAllByText(/fajr/i)).not.toHaveLength(0);
});
