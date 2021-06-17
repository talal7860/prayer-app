import {useCallback, useEffect, useState} from 'react';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification, {Importance} from 'react-native-push-notification';
import {useAsyncStorage} from '@react-native-async-storage/async-storage';
import {Alert, Platform} from 'react-native';
import AppConstants from '../AppConstants';
import I18n from 'i18n-js';

const PUSH_NOTIFICATION_SET_TILL = '@prayer_app:push_notification';

const usePushNotifications = () => {
  const [registered, setRegistered] = useState(false);
  const {getItem, setItem} = useAsyncStorage(PUSH_NOTIFICATION_SET_TILL);
  useEffect(() => {
    const request = async () => {
      const res = await PushNotificationIOS.requestPermissions();
      if (res.authorizationStatus === 2) {
        setRegistered(true);
      } else if (res.authorizationStatus === 0) {
        request();
      }
    };
    request();
  }, []);

  const scheduleNotifications = useCallback(
    (prayerTimes: PrayerTimesByDate) => {
      Alert.alert('Scheduling notifications');
      PushNotification.cancelAllLocalNotifications();
      for (const key in prayerTimes) {
        prayerTimes[key].forEach(time => {
          PushNotification.localNotificationSchedule({
            title: I18n.t('notification.title', {
              label: time.label,
              time: AppConstants.timeFormat.format(time.time),
            }),
            playSound: true,
            soundName: 'Makkah-Azan.wav',
            date: new Date(time.time),
            actions: [I18n.t('notification.action_ok')],
            channelId: AppConstants.notificationChannel,
          });
        });
      }
    },
    [],
  );

  useEffect(() => {
    if (Platform.OS === 'android') {
      PushNotification.channelExists(
        AppConstants.notificationChannel,
        (exists: boolean) => {
          if (!exists) {
            PushNotification.createChannel(
              {
                channelId: AppConstants.notificationChannel, // (required)
                channelName: I18n.t('notification.channel.name'), // (required)
                channelDescription: I18n.t('notification.channel.description'), // (optional) default: undefined.
                playSound: false, // (optional) default: true
                soundName: 'default', // (optional) See `soundName` parameter of `localNotification` function
                importance: Importance.HIGH, // (optional) default: Importance.HIGH. Int value of the Android notification importance
                vibrate: true, // (optional) default: true. Creates the default vibration patten if true.
              },
              (created: any) =>
                console.log(`createChannel returned '${created}'`), // (optional) callback returns whether the channel was created, false means it already existed.
            );
          }
        },
      );
    }
  }, []);

  return {
    registered,
    scheduleNotifications,
  };
};

export default usePushNotifications;
