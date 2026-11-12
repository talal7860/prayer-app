import {useCallback, useEffect, useState} from 'react';
import {Alert, AppState, Platform} from 'react-native';
import * as Notifications from 'expo-notifications';
import I18n from '../I18n';
import AppConstants from '../AppConstants';
import useAppSettings from './useAppSettings';
import {rescheduleNotifications} from '../lib/notifications';
import {registerRescheduleTask} from '../backgroundTask';

const createChannels = () =>
  Promise.all(
    Object.values(AppConstants.notificationChannels).map(channel =>
      Notifications.setNotificationChannelAsync(channel.channelId, {
        name: I18n.t('notification.channel.name'),
        description: I18n.t('notification.channel.description'),
        // eslint-disable-next-line import/namespace -- re-exported via `export *` from a .types module
        importance: Notifications.AndroidImportance.HIGH,
        // Leaving `sound` out gives the system default. Passing 'default' makes
        // expo-notifications look for a bundled file called "default".
        ...(channel.soundName === 'default' ? {} : {sound: channel.soundName}),
        enableVibrate: true,
      }),
    ),
  );

/**
 * Keeps the scheduled prayer notifications in sync: on every settings change, at the start
 * of each day, and each time the app comes back to the foreground. A background task
 * (app/backgroundTask.ts) does the same while the app isn't opened.
 */
const usePushNotifications = () => {
  const [registered, setRegistered] = useState(false);
  const [foregrounded, setForegrounded] = useState(0);
  const {settings, today} = useAppSettings();
  // Ask for permission once the first-run setup is done, not over it.
  const ready = settings.onboarded;

  const requestPermission = useCallback(async () => {
    try {
      const current = await Notifications.getPermissionsAsync();
      const {granted} = current.granted
        ? current
        : await Notifications.requestPermissionsAsync({
            ios: {allowAlert: true, allowBadge: true, allowSound: true},
          });
      setRegistered(granted);
    } catch (error: any) {
      Alert.alert(error.message);
    }
  }, []);

  useEffect(() => {
    if (!ready || !registered || !settings.sound) {
      return;
    }
    rescheduleNotifications(settings).catch(error => console.warn(error));
  }, [ready, registered, settings, today, foregrounded]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        setForegrounded(n => n + 1);
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const setup = async () => {
      if (Platform.OS === 'android') {
        // A failed channel must not stop the permission request below.
        await createChannels().catch(error => console.warn(error));
      }
      await requestPermission();
      await registerRescheduleTask().catch(error => console.warn(error));
    };
    setup();
  }, [ready, requestPermission]);

  return {registered};
};

export default usePushNotifications;
