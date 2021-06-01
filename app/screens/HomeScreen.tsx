import React, {useState, useEffect, useCallback, useMemo, FunctionComponent} from 'react';
import {Text, StyleSheet, View} from 'react-native';
import {find, floor} from 'lodash/fp';
import PushNotification from 'react-native-push-notification';
import Body from '../components/Body';
import {userPrayerTimes} from '../uitl';

const timeFormat = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: 'numeric',
});

const styles = StyleSheet.create({
  screenTitle: {
    display: 'flex',
    alignContent: 'center',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  timeContainer: {
    display: 'flex',
    marginTop: 40,
    flexDirection: 'row',
    alignContent: 'center',
  },
  labelTime: {
    display: 'flex',
  },
  times: {
    marginStart: 30,
    marginEnd: 30,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  content: {
    fontSize: 20,
    paddingTop: 13,
    paddingBottom: 13,
  },
  time: {
    marginStart: 'auto',
  },
  nextPrayer: {
    textAlign: 'center',
    marginTop: 10,
  },
});

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
        time: `${floor(diffHours)}h:${floor(diffMins)}m:${floor(diffSeconds)}s`,
      });
    }, [1000]);

    return () => clearInterval(interval);
  }, [prayerTimes]);

  return (
    <Text style={[styles.content, styles.nextPrayer]}>
      {`${nextPrayer?.label} in ${nextPrayer?.time}`}
    </Text>
  );
};

const HomeScreen = () => {
  const [prayerTimes, setPrayerTimes] =
    useState<PrayerTimeLabel[] | undefined>();
  const date = new Date();
  const processPrayerTimes = useCallback(async () => {
    const times = await userPrayerTimes(date);
    times.forEach(time => {
      PushNotification.localNotificationSchedule({
        message: `${time.label} Time`,
        date: time.time,
        actions: ['Okay'],
      });
    });
    setPrayerTimes(times);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date.toDateString()]);
  useEffect(() => {
    processPrayerTimes();
  }, [processPrayerTimes]);

  return (
    <Body>
      <Text style={styles.screenTitle}>Prayer Times</Text>
      <View style={styles.timeContainer}>
        <View style={[styles.labelTime, styles.times]}>
          {prayerTimes?.map(time => (
            <View style={styles.row} key={`time-${time.label}`}>
              <Text style={[styles.content]} key={`label-${time.label}`}>
                {time.label}
              </Text>
              <Text style={[styles.content, styles.time]}>
                {timeFormat.format(time.time)}
              </Text>
            </View>
          ))}
          <NextPrayer prayerTimes={prayerTimes} />
        </View>
      </View>
    </Body>
  );
};

export default HomeScreen;
