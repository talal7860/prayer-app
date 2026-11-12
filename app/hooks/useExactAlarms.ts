import {useCallback, useEffect, useState} from 'react';
import {AppState, Platform} from 'react-native';
import {canScheduleExactAlarms, openExactAlarmSettings} from '../../modules/exact-alarm';

/**
 * Android 12+ "Alarms & reminders" access. Android 14+ doesn't grant it to new installs, and
 * without it the adhan notifications can arrive tens of minutes late. Re-checked whenever the
 * app comes back to the front (e.g. from that settings page); the foreground reschedule in
 * `usePushNotifications` then sets the notifications again, exact this time.
 */
const useExactAlarms = () => {
  const [allowed, setAllowed] = useState(canScheduleExactAlarms);
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        setAllowed(canScheduleExactAlarms());
      }
    });
    return () => {
      sub.remove();
    };
  }, []);
  const allow = useCallback(() => {
    openExactAlarmSettings();
  }, []);
  return {needed: Platform.OS === 'android' && !allowed, allow};
};

export default useExactAlarms;
