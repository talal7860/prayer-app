import {useCallback, useEffect, useState} from 'react';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification, {Importance} from 'react-native-push-notification';
import {useAsyncStorage} from '@react-native-async-storage/async-storage';
import {last, keys} from 'lodash/fp';
import {Platform} from 'react-native';
import MyDate from '../lib/MyDate';
import AppConstants from '../AppConstants';
import I18n from 'i18n-js';

const PUSH_NOTIFICATION_SET_TILL = '@prayer_app:push_notification';

const usePushNotifications = () => {
  const [registered, setRegistered] = useState(false);
  const {getItem, setItem} = useAsyncStorage(PUSH_NOTIFICATION_SET_TILL);
  useEffect(() => {
    PushNotificationIOS.requestPermissions().then((res: any) => {
      if ([0, 1].includes(res.authorizationStatus)) {
        setRegistered(true);
      }
    });
  }, []);

  const scheduleNotifications = useCallback(
    (prayerTimes: PrayerTimesByDate) => {
      getItem().then((value: string | null) => {
        const date = value ? new Date(value) : new MyDate().prevDay();
        for (const key in prayerTimes) {
          if (new MyDate(key).getTime() > date.getTime()) {
            prayerTimes[key].forEach(time => {
              PushNotification.localNotificationSchedule({
                title: I18n.t('notification.title'),
                playSound: true,
                soundName: 'Makkah-Azan.wav',
                message: I18n.t('notification.message', {label: time.label}),
                date: time.time,
                actions: [I18n.t('notification.action_ok')],
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
