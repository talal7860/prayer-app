import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import {rescheduleNotifications} from './lib/notifications';
import {loadSettings} from './lib/settingsStore';
import {refreshWidgets} from './lib/widgets';
import {checkTravel} from './travelTask';
import {Platform} from 'react-native';

export const RESCHEDULE_TASK = 'reschedule-prayer-notifications';

// Must run at startup, outside React: the OS can launch the app just to run this.
// Only 64 notifications fit on iOS (about 10 days), so this keeps the schedule topped up
// when the app isn't opened.
TaskManager.defineTask(RESCHEDULE_TASK, async () => {
  try {
    const settings = await loadSettings();
    refreshWidgets(settings);
    await rescheduleNotifications(settings);
    // Android travel alerts: no geofence without fine location, so check here instead.
    if (Platform.OS === 'android' && settings.travelAlerts) {
      await checkTravel(settings).catch((error: unknown) => console.warn(error));
    }
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.warn(error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/** Ask the OS to run the task about twice a day. Safe to call on every launch. */
export const registerRescheduleTask = async () => {
  if (await TaskManager.isTaskRegisteredAsync(RESCHEDULE_TASK)) {
    return;
  }
  await BackgroundTask.registerTaskAsync(RESCHEDULE_TASK, {minimumInterval: 12 * 60});
};
