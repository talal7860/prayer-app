import {useCallback, useEffect, useState} from 'react';
import {Alert, Platform} from 'react-native';
import * as Notifications from 'expo-notifications';
import I18n from '../I18n';
import AppConstants from '../AppConstants';
import useAppSettings from './useAppSettings';

const createChannels = () =>
  Promise.all(
    Object.values(AppConstants.notificationChannels).map(channel =>
      Notifications.setNotificationChannelAsync(channel.channelId, {
        name: I18n.t('notification.channel.name'),
        description: I18n.t('notification.channel.description'),
        // eslint-disable-next-line import/namespace -- re-exported via `export *` from a .types module
        importance: Notifications.AndroidImportance.HIGH,
        sound: channel.soundName === 'default' ? 'default' : channel.soundName,
        enableVibrate: true,
      }),
    ),
  );

const usePushNotifications = () => {
  const [registered, setRegistered] = useState(false);
  const {settings} = useAppSettings();

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

  const scheduleNotifications = useCallback(
    async (prayerTimes: PrayerTimesByDate) => {
      if (!settings.sound) {
        return;
      }
      const channel = AppConstants.notificationChannels[settings.sound];
      await Notifications.cancelAllScheduledNotificationsAsync();
      const now = new Date();
      const requests: Promise<string>[] = [];
      for (const key in prayerTimes) {
        prayerTimes[key].forEach(time => {
          if (time.time < now) {
            return;
          }
          requests.push(
            Notifications.scheduleNotificationAsync({
              content: {
                title: I18n.t('notification.title', {
                  label: time.label,
                  time: AppConstants.timeFormat(time.time),
                }),
                body: '',
                // iOS reads the sound from the content; Android from the channel.
                sound: channel.soundName,
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: time.time,
                channelId: channel.channelId,
              },
            }),
          );
        });
      }
      await Promise.all(requests);
    },
    [settings],
  );

  useEffect(() => {
    const setup = async () => {
      if (Platform.OS === 'android') {
        await createChannels();
      }
      await requestPermission();
    };
    setup();
  }, [requestPermission]);

  return {
    registered,
    scheduleNotifications,
  };
};

export default usePushNotifications;
