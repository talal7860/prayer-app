import {useCallback, useEffect, useState} from 'react';
import {Alert, AppState, Platform} from 'react-native';
import * as Notifications from 'expo-notifications';
import I18n from '../I18n';
import {errorMessage} from '../lib/errors';
import AppConstants from '../AppConstants';
import useAppSettings from './useAppSettings';
import {rescheduleNotifications} from '../lib/notifications';
import {registerRescheduleTask} from '../backgroundTask';
import * as TaskManager from 'expo-task-manager';
import {refreshWidgets, syncLiveActivity} from '../lib/widgets';
import {syncWatch} from '../lib/watch';

// Channels from older versions. A channel's sound can't change once created, so a fix needs a new
// id: the WAV adhan replaced the MP3 one, and `adhan-makkah` was created without audio attributes
// (silent on Android 17).
/** The removed travel alerts' geofence task. */
const OLD_GEOFENCE_TASK = 'travel-geofence';

const OLD_CHANNELS = ['prayer-time-notifications-mecca', 'adhan-makkah'];

const createChannels = async () => {
  await Promise.all(OLD_CHANNELS.map(id => Notifications.deleteNotificationChannelAsync(id)));
  await Promise.all(
    Object.values(AppConstants.notificationChannels).map(channel =>
      Notifications.setNotificationChannelAsync(channel.channelId, {
        name: I18n.t('notification.channel.name'),
        description: I18n.t('notification.channel.description'),
        // eslint-disable-next-line import/namespace -- re-exported via `export *` from a .types module
        importance: Notifications.AndroidImportance.HIGH,
        // Leaving `sound` out gives the system default. Passing 'default' makes
        // expo-notifications look for a bundled file called "default". With a sound, pass the
        // audio attributes too: without them expo-notifications sets `null`, which Android 16
        // fills in but Android 17 doesn't, so the notification arrives silently.
        ...(channel.soundName === 'default'
          ? {}
          : {
              sound: channel.soundName,
              audioAttributes: {
                // eslint-disable-next-line import/namespace -- re-exported via `export *` from a .types module
                usage: Notifications.AndroidAudioUsage.NOTIFICATION,
                // eslint-disable-next-line import/namespace -- re-exported via `export *` from a .types module
                contentType: Notifications.AndroidAudioContentType.SONIFICATION,
              },
            }),
        enableVibrate: true,
      }),
    ),
  );
};

/**
 * Keeps the scheduled prayer notifications in sync: on every settings change, at the start
 * of each day, and each time the app comes back to the foreground. A background task
 * (app/backgroundTask.ts) does the same while the app isn't opened.
 */
const usePushNotifications = () => {
  const [registered, setRegistered] = useState(false);
  const [foregrounded, setForegrounded] = useState(0);
  const [backgrounded, setBackgrounded] = useState(0);
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
    } catch (error: unknown) {
      Alert.alert(errorMessage(error) ?? String(error));
    }
  }, []);

  // Widgets and the Live Activity don't need notification permission.
  useEffect(() => {
    if (!ready) {
      return;
    }
    refreshWidgets(settings);
    void syncLiveActivity(settings);
    syncWatch(settings);
  }, [ready, settings, today, foregrounded, backgrounded]);

  useEffect(() => {
    if (!ready || !registered || !settings.sound) {
      return;
    }
    rescheduleNotifications(settings).catch((error: unknown) => console.warn(error));
  }, [ready, registered, settings, today, foregrounded]);

  // Travel alerts (an "Always"-location geofence) were removed. Stop a geofence that an older
  // version registered, so iOS doesn't keep a region for a task that no longer exists.
  useEffect(() => {
    if (!ready) {
      return;
    }
    TaskManager.isTaskRegisteredAsync(OLD_GEOFENCE_TASK)
      .then(registered =>
        registered ? TaskManager.unregisterTaskAsync(OLD_GEOFENCE_TASK) : undefined,
      )
      .catch((error: unknown) => {
        console.warn(error);
      });
  }, [ready]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        setForegrounded(n => n + 1);
      } else if (state === 'background') {
        // The last chance to start the Live Activity before the app is suspended.
        setBackgrounded(n => n + 1);
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
        await createChannels().catch((error: unknown) => console.warn(error));
      }
      await requestPermission();
      await registerRescheduleTask().catch((error: unknown) => console.warn(error));
    };
    void setup();
  }, [ready, requestPermission]);

  return {registered};
};

export default usePushNotifications;
