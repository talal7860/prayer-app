import * as Notifications from 'expo-notifications';
import {rescheduleNotifications} from '../app/lib/notifications';
import {MAX_PENDING} from '../app/lib/schedule';
import {defaultSettings, SETTINGS_KEY} from '../app/lib/settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({granted: true})),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('id')),
  SchedulableTriggerInputTypes: {DATE: 'date'},
}));

jest.mock('expo-task-manager', () => ({defineTask: jest.fn()}));
jest.mock('expo-background-task', () => ({
  BackgroundTaskResult: {Success: 1, Failed: 2},
}));

const scheduled = () =>
  (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.map(([r]) => r);

beforeEach(() => jest.clearAllMocks());

it('schedules well beyond 5 days, up to the iOS limit', async () => {
  const now = new Date(2026, 10, 11, 9);
  await expect(rescheduleNotifications(defaultSettings, now)).resolves.toBe(MAX_PENDING);
  const dates = scheduled().map(r => r.trigger.date as Date);
  const lastDay = Math.max(...dates.map(d => d.getTime()));
  expect((lastDay - now.getTime()) / 86400000).toBeGreaterThan(10);
  expect(scheduled()[0].trigger.channelId).toBe('adhan-makkah');
  expect(scheduled()[MAX_PENDING - 1].trigger.channelId).toBe('prayer-time-notifications');
});

it('does nothing without notification permission', async () => {
  (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({granted: false});
  await expect(rescheduleNotifications(defaultSettings)).resolves.toBe(0);
  expect(Notifications.cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
});

it('runs calls one at a time, so cancels never interleave', async () => {
  const order: string[] = [];
  (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockImplementation(async () => {
    order.push('cancel');
  });
  (Notifications.scheduleNotificationAsync as jest.Mock).mockImplementation(async () => {
    if (order[order.length - 1] !== 'schedule') {
      order.push('schedule');
    }
  });
  await Promise.all([rescheduleNotifications(defaultSettings), rescheduleNotifications(defaultSettings)]);
  expect(order).toEqual(['cancel', 'schedule', 'cancel', 'schedule']);
});

it('the background task reschedules from the saved settings', async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage');
  const edmonton = {location: {lat: 53.5461, lng: -113.4938}, city: 'Edmonton, AB', muted: {isha: true}};
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(edmonton));
  const TaskManager = require('expo-task-manager');
  require('../app/backgroundTask');
  const [[name, task]] = TaskManager.defineTask.mock.calls;
  expect(name).toBe('reschedule-prayer-notifications');
  await expect(task({})).resolves.toBe(1);
  // Isha is muted in the saved settings, so none is scheduled.
  expect(scheduled().length).toBeGreaterThan(20);
  expect(scheduled().some(r => r.content.title.includes('Isha'))).toBe(false);
});
