jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../app/widgets/NextPrayer', () => ({}));
jest.mock('../app/widgets/PrayerRing', () => ({}));
jest.mock('../app/widgets/PrayerActivity', () => ({start: jest.fn(), getInstances: jest.fn()}));

import {Platform} from 'react-native';
import PrayerActivity from '../app/widgets/PrayerActivity';
import {activityFor} from '../app/lib/widgetData';
import {prayerTimesFor} from '../app/lib/prayerTimes';
import {defaultSettings, parseSettings} from '../app/lib/settingsStore';
import {syncLiveActivity} from '../app/lib/widgets';

const settings: Settings = {...defaultSettings, city: 'Calgary, AB', liveActivity: true};
const off: Settings = {...settings, liveActivity: false};
const dhuhr = prayerTimesFor(settings, new Date(2026, 2, 10, 12)).find(p => p.key === 'dhuhr')!;
const soon = new Date(dhuhr.time.getTime() - 20 * 60 * 1000);

const activity = PrayerActivity as unknown as {start: jest.Mock; getInstances: jest.Mock};
const running = () => ({update: jest.fn(async () => {}), end: jest.fn(async () => {})});

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = 'ios';
});

it('is off by default, also for settings saved before it existed', () => {
  expect(defaultSettings.liveActivity).toBe(false);
  expect(parseSettings(JSON.stringify({headsUp: true})).liveActivity).toBe(false);
  expect(parseSettings(JSON.stringify({liveActivity: true})).liveActivity).toBe(true);
});

it('has no activity when the setting is off', () => {
  expect(activityFor(settings, soon)?.next).toBe('Dhuhr');
  expect(activityFor(off, soon)).toBeNull();
});

it('starts an activity in the hour before a prayer when on', async () => {
  activity.getInstances.mockReturnValue([]);
  await syncLiveActivity(settings, soon);
  expect(activity.start).toHaveBeenCalledTimes(1);
});

it('never starts or updates one when off, and ends a running one right away', async () => {
  activity.getInstances.mockReturnValue([]);
  await syncLiveActivity(off, soon);
  expect(activity.start).not.toHaveBeenCalled();

  const current = running();
  activity.getInstances.mockReturnValue([current]);
  await syncLiveActivity(off, soon);
  expect(current.update).not.toHaveBeenCalled();
  expect(current.end).toHaveBeenCalledWith('immediate');
});
