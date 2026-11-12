import * as Notifications from 'expo-notifications';
import {notificationId, rescheduleNotifications} from '../app/lib/notifications';
import {MAX_PENDING} from '../app/lib/schedule';
import {defaultSettings, SETTINGS_KEY} from '../app/lib/settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({granted: true})),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('id')),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
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
  const [, task] = TaskManager.defineTask.mock.calls.find(
    ([name]: [string]) => name === 'reschedule-prayer-notifications',
  );
  await expect(task({})).resolves.toBe(1);
  // Isha is muted in the saved settings, so none is scheduled.
  expect(scheduled().length).toBeGreaterThan(20);
  expect(scheduled().some(r => r.content.title.includes('Isha'))).toBe(false);
});

it('gives every notification a fixed id, and removes pending ones that are not in the plan', async () => {
  const now = new Date(2026, 10, 11, 9);
  await rescheduleNotifications(defaultSettings, now);
  const ids = scheduled().map(r => r.identifier as string);
  expect(new Set(ids).size).toBe(MAX_PENDING);
  expect(ids[0]).toMatch(/^prayer:adhan:dhuhr:\d+$/);
  // The same plan gets the same ids, so scheduling again replaces instead of duplicating.
  jest.clearAllMocks();
  await rescheduleNotifications(defaultSettings, now);
  expect(scheduled().map(r => r.identifier)).toEqual(ids);

  // A leftover from another run (a minute off) is cancelled; the plan's own are kept.
  (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValueOnce([
    {identifier: ids[0]},
    {identifier: 'prayer:adhan:dhuhr:1'},
    {identifier: 'some-old-random-id'},
  ]);
  await rescheduleNotifications(defaultSettings, now);
  const cancelled = (Notifications.cancelScheduledNotificationAsync as jest.Mock).mock.calls.map(([id]) => id);
  expect(cancelled).toEqual(['prayer:adhan:dhuhr:1', 'some-old-random-id']);
});

it('the id is the kind, the prayer and the minute', () => {
  const date = new Date(2026, 10, 11, 12, 53, 20);
  expect(notificationId({kind: 'headsUp', prayer: 'dhuhr', title: '', date})).toBe(
    `prayer:headsUp:dhuhr:${Math.floor(date.getTime() / 60000)}`,
  );
});
