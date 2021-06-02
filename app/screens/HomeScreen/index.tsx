import React, {useState, useEffect, FunctionComponent, useMemo} from 'react';
import {Text, View, useColorScheme, StyleProp, TextStyle} from 'react-native';
import {find, floor, filter, range, map, flatten} from 'lodash/fp';
import PushNotification from 'react-native-push-notification';
import Body from '../../components/Body';
import Colors from '../../theme/Colors';
import useAppSettings from '../../hooks/useAppSettings';
import styles from './styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NUMBER_OF_DAYS_TO_FETCH = 30;
const PUSH_NOTIFICATION_SET_TILL = '@prayer_app:push_notification';

const timeFormat = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: 'numeric',
});

const filterTimesByDate = (date: Date) =>
  filter(
    (time: PrayerTimeLabel) => time.time.toDateString() === date.toDateString(),
  );

const filterTimesByToday = filterTimesByDate(new Date());

const displayTime = (time: number) => {
  const value = floor(time);
  if (value < 10) {
    return `0${value}`;
  }
  return value;
};

interface Content {
  style: StyleProp<TextStyle> | undefined;
}

const Content: FunctionComponent<Content> = ({style, ...rest}) => {
  const isDarkMode = useColorScheme() === 'dark';
  const textColor = {
    color: isDarkMode ? Colors.light : Colors.dark,
  };

  return <Text {...rest} style={[styles.content, textColor, style]} />;
};

const Title = ({...rest}) => {
  const isDarkMode = useColorScheme() === 'dark';
  const textColor = {
    color: isDarkMode ? Colors.light : Colors.dark,
  };

  return <Text {...rest} style={[styles.title, textColor]} />;
};

interface NextPrayerProps {
  prayerTimes: PrayerTimeLabel[] | undefined;
}

const NextPrayer: FunctionComponent<NextPrayerProps> = ({prayerTimes}) => {
  const [nextPrayer, setNextPrayer] = useState({label: '', time: ''});
  useEffect(() => {
    if (!prayerTimes) {
      return undefined;
    }
    const interval = setInterval(() => {
      const prayer = find((p: PrayerTimeLabel) => p.time > new Date())(
        prayerTimes,
      );
      if (!prayer) {
        return;
      }
      const diff = prayer?.time?.getTime() - Date.now();
      const diffHours = diff / (1000 * 60 * 60);
      const diffMins = (diffHours - floor(diffHours)) * 60;
      const diffSeconds = (diffMins - floor(diffMins)) * 60;
      setNextPrayer({
        label: prayer?.label || '',
        time: `${displayTime(diffHours)}h:${displayTime(
          diffMins,
        )}m:${displayTime(diffSeconds)}s`,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [prayerTimes]);

  return (
    <Content style={[styles.nextPrayer]}>
      {`${nextPrayer?.label} in ${nextPrayer?.time}`}
    </Content>
  );
};

const HomeScreen = () => {
  const {getPrayerTimes} = useAppSettings();
  const prayerTimes: PrayerTimeLabel[] = useMemo(() => {
    return flatten(
      map((index: number) => {
        const date = new Date();
        date.setDate(date.getDate() + index);
        return getPrayerTimes(date);
      })(range(0)(NUMBER_OF_DAYS_TO_FETCH)),
    );
  }, [getPrayerTimes]);
  useEffect(() => {
    AsyncStorage.getItem(PUSH_NOTIFICATION_SET_TILL).then(
      (value: string | null) => {
        const yesterday = new Date();
        yesterday.setDate(new Date().getDate() - 1);
        const date = value ? new Date(value) : yesterday;
        filterTimesByDate(date)(prayerTimes).forEach(
          (time: PrayerTimeLabel) => {
            PushNotification.localNotificationSchedule({
              message: `${time.label} Time`,
              date: time.time,
              actions: ['Okay'],
            });
          },
        );
      },
    );
  }, [prayerTimes]);

  const todayPrayers = useMemo(
    () => filterTimesByToday(prayerTimes),
    [prayerTimes],
  );

  return (
    <Body>
      <Title>Prayer Times</Title>
      <View style={styles.timeContainer}>
        <View style={[styles.labelTime, styles.times]}>
          {todayPrayers?.map(time => (
            <View style={styles.row} key={`time-${time.label}`}>
              <Content style={styles.content}>{time.label}</Content>
              <Content style={[styles.content, styles.time]}>
                {timeFormat.format(time.time)}
              </Content>
            </View>
          ))}
          <NextPrayer prayerTimes={prayerTimes} />
        </View>
      </View>
    </Body>
  );
};

export default HomeScreen;
