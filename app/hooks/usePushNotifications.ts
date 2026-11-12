import {useCallback, useEffect, useMemo, useState} from 'react';
import {range} from 'lodash/fp';
import {Alert, Platform} from 'react-native';
import * as Notifications from 'expo-notifications';
import I18n from '../I18n';
import AppConstants from '../AppConstants';
import useAppSettings from './useAppSettings';
import {addDays} from '../lib/prayerDay';
import {planNotifications} from '../lib/schedule';

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

const usePushNotifications = () => {
  const [registered, setRegistered] = useState(false);
  const {settings, getPrayerTimes, today} = useAppSettings();

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

  const plan = useMemo(() => {
    const base = new Date(today);
    const days = range(0, AppConstants.numberOfDaysToFetch).map(i =>
      getPrayerTimes(addDays(base, i)),
    );
    return planNotifications(days, settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getPrayerTimes, today, settings.muted, settings.headsUp, settings.timeFormat]);

  useEffect(() => {
    if (!registered || !settings.sound) {
      return;
    }
    const adhan = AppConstants.notificationChannels[settings.sound];
    const plain = AppConstants.notificationChannels.default;
    const schedule = async () => {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Promise.all(
        plan.map(n => {
          const channel = n.kind === 'adhan' ? adhan : plain;
          return Notifications.scheduleNotificationAsync({
            content: {
              title: n.title,
              body: '',
              // iOS reads the sound from the content; Android from the channel.
              sound: channel.soundName,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: n.date,
              channelId: channel.channelId,
            },
          });
        }),
      );
    };
    schedule().catch(error => console.warn(error));
  }, [registered, plan, settings.sound]);

  useEffect(() => {
    const setup = async () => {
      if (Platform.OS === 'android') {
        // A failed channel must not stop the permission request below.
        await createChannels().catch(error => console.warn(error));
      }
      await requestPermission();
    };
    setup();
  }, [requestPermission]);

  return {registered};
};

export default usePushNotifications;
