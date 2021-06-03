import {useCallback, useEffect, useState} from 'react';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification, {Importance} from 'react-native-push-notification';
import {useAsyncStorage} from '@react-native-async-storage/async-storage';
import {last, keys} from 'lodash/fp';
import {Platform} from 'react-native';
import MyDate from '../lib/MyDate';
import AppConstants from '../AppConstants';

const PUSH_NOTIFICATION_SET_TILL = '@prayer_app:push_notification';

const usePushNotifications = () => {
  const [registered, setRegistered] = useState(false);
  const {getItem, setItem} = useAsyncStorage(PUSH_NOTIFICATION_SET_TILL);
  useEffect(() => {
    PushNotificationIOS.addEventListener('register', () => setRegistered(true));
    return () => PushNotificationIOS.removeEventListener('register');
  }, []);

  const scheduleNotifications = useCallback(
    (prayerTimes: PrayerTimesByDate) => {
      getItem().then((value: string | null) => {
        const date = value ? new Date(value) : new MyDate().prevDay();
        for (const key in prayerTimes) {
          if (new MyDate(key).getTime() > date.getTime()) {
            prayerTimes[key].forEach(time => {
              PushNotification.localNotificationSchedule({
                title: 'Prayer Time',
                playSound: true,
                soundName: 'Makkah-Azan.wav',
                message: `${time.label} Time`,
                date: time.time,
                actions: ['Okay'],
                channelId: AppConstants.notificationChannel,
              });
            });
          }
          setItem(last(keys(prayerTimes)) || '');
        }
      });
    },
    [getItem, setItem],
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
                channelName: 'Prayer Time Notifications', // (required)
                channelDescription: 'Prayer Time Notifications', // (optional) default: undefined.
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
