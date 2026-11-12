import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import {rescheduleNotifications} from './lib/notifications';
import {loadSettings} from './lib/settingsStore';

export const RESCHEDULE_TASK = 'reschedule-prayer-notifications';

// Must run at startup, outside React: the OS can launch the app just to run this.
// Only 64 notifications fit on iOS (about 10 days), so this keeps the schedule topped up
// when the app isn't opened.
TaskManager.defineTask(RESCHEDULE_TASK, async () => {
  try {
    await rescheduleNotifications(await loadSettings());
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
