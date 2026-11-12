import {requireOptionalNativeModule} from 'expo';

type ExactAlarmModule = {canScheduleExactAlarms(): boolean; openSettings(): boolean};

// Android only; missing on iOS, in Jest and in Expo Go.
const native = requireOptionalNativeModule<ExactAlarmModule>('ExactAlarm');

/**
 * Whether Android lets the app schedule exact alarms ("Alarms & reminders"). Without it the adhan
 * notifications can be late. True on iOS and wherever the module is missing.
 */
export const canScheduleExactAlarms = (): boolean => {
  try {
    return native?.canScheduleExactAlarms() ?? true;
  } catch {
    return true;
  }
};

/** Opens the app's "Alarms & reminders" page in Android settings. */
export const openExactAlarmSettings = (): boolean => {
  try {
    return native?.openSettings() ?? false;
  } catch {
    return false;
  }
};
