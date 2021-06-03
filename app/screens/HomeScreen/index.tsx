import React, {useState, useEffect, FunctionComponent, useMemo} from 'react';
import {Text, View, useColorScheme, StyleProp, TextStyle} from 'react-native';
import {find, floor, range, forEach, flatten, last, keys} from 'lodash/fp';
// import PushNotification from 'react-native-push-notification';
import Body from '../../components/Body';
import MyDate from '../../lib/MyDate';
import Colors from '../../theme/Colors';
import useAppSettings from '../../hooks/useAppSettings';
import styles from './styles';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import AppConstants from '../../AppConstants';
import usePushNotifications from '../../hooks/usePushNotifications';

const timeFormat = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: 'numeric',
});

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
  prayerTimes: PrayerTimesByDate | undefined;
}

const NextPrayer: FunctionComponent<NextPrayerProps> = ({prayerTimes}) => {
  const [nextPrayer, setNextPrayer] = useState({label: '', time: ''});
  useEffect(() => {
    if (!prayerTimes) {
      return undefined;
    }
    const flattened = flatten(Object.values(prayerTimes));
    const interval = setInterval(() => {
      const prayer = find((p: PrayerTimeLabel) => p.time > new MyDate())(
        flattened,
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
  const {registered, scheduleNotifications} = usePushNotifications();
  const today = new MyDate().beginningOfDay().getTime();
  const prayerTimes: PrayerTimesByDate = useMemo(() => {
    const data: PrayerTimesByDate = {};
    forEach((index: number) => {
      const date = new MyDate().beginningOfDay();
      date.setDate(date.getDate() + index);
      data[date.getTime()] = getPrayerTimes(date);
    })(range(0)(AppConstants.numberOfDaysToFetch));
    return data;
  }, [getPrayerTimes]);

  useEffect(() => {
    if (registered) {
      scheduleNotifications(prayerTimes);
    }
  }, [prayerTimes, registered, scheduleNotifications]);

  return (
    <Body>
      <Title>Prayer Times</Title>
      <View style={styles.timeContainer}>
        <View style={[styles.labelTime, styles.times]}>
          {prayerTimes[today]?.map(time => (
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
