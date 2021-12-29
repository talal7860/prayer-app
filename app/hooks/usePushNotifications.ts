import {useCallback, useEffect, useState} from 'react';
import PushNotification, {Importance} from 'react-native-push-notification';
import {Alert, Platform} from 'react-native';
import I18n from '../I18n';
import AppConstants from '../AppConstants';
import useAppSettings from './useAppSettings';

const createChannel = (options: any) =>
  new Promise(resolve => {
    PushNotification.createChannel(options, resolve);
  });

const usePushNotifications = () => {
  const [registered, setRegistered] = useState(false);
  const {settings} = useAppSettings();
  const requestPermission = useCallback(async () => {
    try {
      const res = await PushNotification.requestPermissions();
      if (res) {
        // for IOS
        if (res.authorizationStatus === 2) {
          setRegistered(true);
        } else if (res.authorizationStatus === 0) {
          requestPermission();
        }
      } else {
        // for android
        setRegistered(true);
      }
    } catch (error: any) {
      Alert.alert(error.message);
    }
  }, []);

  const scheduleNotifications = useCallback(
    (prayerTimes: PrayerTimesByDate) => {
      if (!settings.sound) {
        return;
      }
      PushNotification.cancelAllLocalNotifications();
      for (const key in prayerTimes) {
        prayerTimes[key].forEach(time => {
          if (time.time < new Date()) {
            return;
          }
          PushNotification.localNotificationSchedule({
            ...AppConstants.notificationChannels[settings.sound],
            title: I18n.t('notification.title', {
              label: time.label,
              time: AppConstants.timeFormat(time.time),
            }),
            message: '',
            playSound: true,
            date: time.time,
            actions: [I18n.t('notification.action_ok')],
          });
        });
      }
    },
    [settings],
  );

  useEffect(() => {
    if (Platform.OS === 'ios') {
      requestPermission();
    }
  }, [requestPermission]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const createChannels = async () => {
        await Promise.all(
          Object.values(AppConstants.notificationChannels).map(channel =>
            createChannel({
              ...channel,
              channelName: I18n.t('notification.channel.name'),
              channelDescription: I18n.t('notification.channel.description'),
              playSound: true,
              importance: Importance.HIGH,
              vibrate: true,
            }),
          ),
        );
        requestPermission();
      };
      createChannels();
    }
  }, [requestPermission]);

  return {
    registered,
    scheduleNotifications,
  };
};

export default usePushNotifications;
