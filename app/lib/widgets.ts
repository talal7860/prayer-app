import {Platform} from 'react-native';
import NextPrayer from '../widgets/NextPrayer';
import PrayerRing from '../widgets/PrayerRing';
import PrayerActivity from '../widgets/PrayerActivity';
import {activityFor, nextPrayerProps, widgetTimeline} from './widgetData';

/** Push fresh times to the home and lock screen widgets. Never throws. */
export const refreshWidgets = (settings: Settings, now: Date = new Date()) => {
  try {
    if (Platform.OS === 'ios') {
      const timeline = widgetTimeline(settings, now);
      NextPrayer.updateTimeline(timeline);
      PrayerRing.updateTimeline(timeline);
    } else {
      NextPrayer.updateSnapshot(nextPrayerProps(settings, now));
    }
  } catch (error) {
    console.warn(error);
  }
};

/**
 * Show the Live Activity countdown in the hour before a prayer, and end ones whose prayer
 * has passed. Live Activities can only start while the app is open, so this runs on every
 * foreground and as the app goes to the background.
 */
export const syncLiveActivity = async (settings: Settings, now: Date = new Date()) => {
  if (Platform.OS !== 'ios') {
    return;
  }
  try {
    const wanted = activityFor(settings, now);
    const instances = PrayerActivity.getInstances();
    const current = instances.at(0);
    const extra = instances.slice(1);
    // One activity at a time. Update it in place rather than ending and restarting it.
    await Promise.all(extra.map(a => a.end('immediate')));
    if (!wanted) {
      await current?.end('immediate');
    } else if (current) {
      await current.update(wanted, new Date(wanted.at));
    } else {
      PrayerActivity.start(wanted, undefined, new Date(wanted.at));
    }
  } catch (error) {
    console.warn(error);
  }
};
