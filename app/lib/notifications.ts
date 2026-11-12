import {range} from 'lodash/fp';
import * as Notifications from 'expo-notifications';
import AppConstants from '../AppConstants';
import {addDays} from './prayerDay';
import {prayerTimesFor} from './prayerTimes';
import {DAYS_AHEAD, fillSchedule, type PlannedNotification} from './schedule';

/**
 * A fixed id per notification (kind, prayer, minute). Scheduling the same one again replaces
 * it instead of adding a second copy, whatever ran before.
 */
export const notificationId = (n: PlannedNotification) =>
  `prayer:${n.kind}:${n.prayer ?? '-'}:${Math.floor(n.date.getTime() / 60000)}`;

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const run = async (settings: Settings, now: Date) => {
  const {granted} = await Notifications.getPermissionsAsync();
  if (!granted) {
    return 0;
  }
  const base = startOfDay(now);
  const days = range(0, DAYS_AHEAD).map(i => prayerTimesFor(settings, addDays(base, i)));
  const plan = fillSchedule(days, settings, now);
  const adhan = AppConstants.notificationChannels[settings.sound];
  const plain = AppConstants.notificationChannels.default;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Promise.all(
    plan.map(n => {
      const channel = n.kind === 'adhan' ? adhan : plain;
      return Notifications.scheduleNotificationAsync({
        identifier: notificationId(n),
        content: {
          title: n.title,
          body: '',
          // iOS reads the sound from the content; Android from the channel.
          sound: channel.soundName,
          // Lets the adhan through Focus modes (needs the time-sensitive entitlement).
          interruptionLevel: n.kind === 'reminder' ? 'active' : 'timeSensitive',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: n.date,
          channelId: channel.channelId,
        },
      });
    }),
  );
  // The final say: drop anything pending that isn't in this plan (left by an earlier run, e.g.
  // the background task and the app rescheduling at the same moment). Two copies of the same
  // prayer a minute apart showed up on an iPhone without this.
  const keep = new Set(plan.map(notificationId));
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    pending
      .filter(p => !keep.has(p.identifier))
      .map(p => Notifications.cancelScheduledNotificationAsync(p.identifier)),
  );
  return plan.length;
};

let queue: Promise<unknown> = Promise.resolve();

/**
 * Replace every scheduled notification with a fresh plan from `now`.
 * Calls run one after another, so the app and the background task can't interleave
 * a cancel with another run's schedule. Resolves to the number scheduled.
 */
export const rescheduleNotifications = (
  settings: Settings,
  now: Date = new Date(),
): Promise<number> => {
  const next = queue.then(() => run(settings, now));
  queue = next.catch(() => {});
  return next;
};
