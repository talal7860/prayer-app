import React, {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Card} from '../../components/ui/Card';
import Icon from '../../components/ui/Icon';
import Segmented from '../../components/ui/Segmented';
import Text from '../../components/ui/Text';
import useAppSettings from '../../hooks/useAppSettings';
import usePalette from '../../hooks/usePalette';
import I18n, {formatDate} from '../../I18n';
import {
  addDays,
  daylightMinutes,
  formatCoords,
  formatTime,
  isFriday,
  toDayTimes,
} from '../../lib/prayerDay';
import {errorMessage} from '../../lib/errors';
import {timetableHtml} from '../../lib/timetable';
import useReadableWidth from '../../hooks/useReadableWidth';
import {isLargeText, joinLabel} from '../../lib/a11y';

type Week = 'this' | 'next';
const COLUMNS: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const HEADERS = ['fajr', 'rise', 'dhuhr', 'asr', 'magh', 'isha'];

const WeekScreen = () => {
  const column = useReadableWidth();
  const insets = useSafeAreaInsets();
  const {t, isDark} = usePalette();
  const {settings, getPrayerTimes, today, calculationMethod} = useAppSettings();
  const [week, setWeek] = useState<Week>('this');
  const offset = week === 'this' ? 0 : 7;

  const days = useMemo(() => {
    const base = new Date(today);
    return Array.from({length: 7}, (_, i) => {
      const date = addDays(base, offset + i);
      return {date, times: toDayTimes(getPrayerTimes(date))};
    });
  }, [getPrayerTimes, today, offset]);

  const daylight = useMemo(() => {
    const base = new Date(today);
    const now = daylightMinutes(toDayTimes(getPrayerTimes(base)));
    const prev = daylightMinutes(toDayTimes(getPrayerTimes(addDays(base, -1))));
    return {now, delta: Math.round(now - prev)};
  }, [getPrayerTimes, today]);

  const [sharing, setSharing] = useState(false);
  const monthName = formatDate(new Date(today), {month: 'long'});
  const shareMonth = async () => {
    setSharing(true);
    try {
      const {uri} = await Print.printToFileAsync({html: timetableHtml(settings, new Date(today))});
      await Sharing.shareAsync(uri, {mimeType: 'application/pdf', UTI: 'com.adobe.pdf'});
    } catch (error: unknown) {
      Alert.alert(I18n.t('timetable.failed'), errorMessage(error));
    } finally {
      setSharing(false);
    }
  };

  const hm = (d: Date) => formatTime(d, settings.timeFormat, false);
  const full = (d: Date) => formatTime(d, settings.timeFormat);
  // At large text sizes seven columns can't fit: each day becomes a card with a line per prayer.
  const {fontScale} = useWindowDimensions();
  const asList = isLargeText(fontScale);
  const dayNote = (date: Date, isToday: boolean) =>
    isToday
      ? I18n.t('week.today')
      : isFriday(date)
        ? I18n.t('prayer.jumuah')
        : formatDate(date, {month: 'short'});
  /** "Thursday, November 12, Today: Fajr 6:12 AM, Sunrise 7:45 AM, …": one stop per day. */
  const dayLabel = (date: Date, times: (typeof days)[number]['times'], isToday: boolean) =>
    `${joinLabel(
      formatDate(date, {weekday: 'long', month: 'long', day: 'numeric'}),
      isToday && I18n.t('week.today'),
    )}: ${joinLabel(
      ...COLUMNS.map(
        k =>
          `${I18n.t(k === 'dhuhr' && isFriday(date) ? 'prayer.jumuah' : `prayer.${k}`)} ${full(times[k])}`,
      ),
    )}`;
  const city = settings.city ?? formatCoords(settings.location);
  const method = calculationMethod().split(',').pop()?.trim();
  const asrName = I18n.t(`asrNames.${settings.asr}`);
  const length = I18n.t('week.length', {
    h: Math.floor(daylight.now / 60),
    m: String(Math.round(daylight.now % 60)).padStart(2, '0'),
  });
  const deltaText =
    daylight.delta === 0
      ? I18n.t('week.same')
      : I18n.t(daylight.delta > 0 ? 'week.longer' : 'week.shorter', {
          min: Math.abs(daylight.delta),
        });

  return (
    <View style={[styles.root, {backgroundColor: t.surface}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={[styles.scroll, {paddingTop: insets.top + 16}, column]}>
        <View style={styles.head}>
          <Text
            weight="bold"
            size={30}
            color={t.text}
            accessibilityRole="header"
            style={styles.title}>
            {I18n.t(week === 'this' ? 'week.thisWeek' : 'week.nextWeek')}
          </Text>
          <Text size={14} color={t.muted}>
            {`${city} · ${method} · ${I18n.t('asrNames.label', {asr: asrName})}`}
          </Text>
        </View>

        <View style={styles.segment}>
          <Segmented
            stretch
            accessibilityLabel={I18n.t('week.chooseWeek')}
            options={[
              {value: 'this', label: I18n.t('week.thisWeek')},
              {value: 'next', label: I18n.t('week.nextWeek')},
            ]}
            value={week}
            onChange={setWeek}
          />
        </View>

        {asList ? (
          days.map(({date, times}, i) => {
            const isToday = week === 'this' && i === 0;
            const fri = isFriday(date);
            return (
              <Card
                key={date.toDateString()}
                style={{...styles.dayCard, ...(isToday ? {borderColor: t.accent} : {})}}>
                <View accessible accessibilityLabel={dayLabel(date, times, isToday)}>
                  <Text weight="semibold" size={16} color={isToday ? t.accent : t.text}>
                    {`${formatDate(date, {weekday: 'long', day: 'numeric'})} · ${dayNote(date, isToday)}`}
                  </Text>
                  {COLUMNS.map(k => (
                    <View key={k} style={styles.listRow}>
                      <Text size={15} color={t.muted} style={styles.listName}>
                        {I18n.t(k === 'dhuhr' && fri ? 'prayer.jumuah' : `prayer.${k}`)}
                      </Text>
                      <Text
                        weight={k === 'dhuhr' && fri ? 'bold' : 'medium'}
                        size={15}
                        color={k === 'dhuhr' && fri ? t.accent : t.text}
                        style={styles.listTime}>
                        {full(times[k])}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            );
          })
        ) : (
          <Card style={styles.table}>
            <View
              style={[styles.tr, styles.th, {borderBottomColor: t.border}]}
              // The abbreviated headers are for the eye; each row says its prayer names.
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants">
              <Text
                weight="semibold"
                size={11}
                color={t.muted}
                style={[styles.dayCol, styles.caps]}>
                {I18n.t('week.day').toUpperCase()}
              </Text>
              {HEADERS.map(h => (
                <Text
                  key={h}
                  weight="semibold"
                  size={11}
                  color={t.muted}
                  style={[styles.cell, styles.caps]}>
                  {I18n.t(`week.${h}`).toUpperCase()}
                </Text>
              ))}
            </View>
            {days.map(({date, times}, i) => {
              const isToday = week === 'this' && i === 0;
              const fri = isFriday(date);
              return (
                <View
                  key={date.toDateString()}
                  accessible
                  accessibilityLabel={dayLabel(date, times, isToday)}
                  style={[
                    styles.tr,
                    styles.td,
                    {backgroundColor: isToday ? t.hi : t.bg, borderBottomColor: t.divider},
                    i === days.length - 1 && styles.lastRow,
                  ]}>
                  <View style={styles.dayCol}>
                    <Text weight="semibold" size={13.5} color={isToday ? t.accent : t.text}>
                      {`${formatDate(date, {weekday: 'short'})} ${date.getDate()}`}
                    </Text>
                    <Text size={11} color={t.muted}>
                      {dayNote(date, isToday)}
                    </Text>
                  </View>
                  {COLUMNS.map(k => (
                    <Text
                      key={k}
                      weight={k === 'dhuhr' && fri ? 'bold' : 'regular'}
                      size={13.5}
                      color={k === 'sunrise' ? t.muted : k === 'dhuhr' && fri ? t.accent : t.text}
                      style={styles.cell}>
                      {hm(times[k])}
                    </Text>
                  ))}
                </View>
              );
            })}
          </Card>
        )}

        <Card style={styles.daylight}>
          <View style={[styles.badge, {backgroundColor: t.hi}]}>
            <Icon name="sunrise" size={20} color={t.accent} />
          </View>
          <View style={styles.daylightText} accessible>
            <Text weight="semibold" size={15} color={t.text}>
              {I18n.t('week.daylight', {length})}
            </Text>
            <Text size={13} color={t.muted}>
              {`${deltaText} · ${I18n.t('week.friday')}`}
            </Text>
          </View>
        </Card>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={I18n.t('timetable.share', {month: monthName})}
          accessibilityHint={I18n.t('timetable.hint')}
          accessibilityState={{busy: sharing, disabled: sharing}}
          disabled={sharing}
          onPress={shareMonth}
          style={({pressed}) => [
            styles.share,
            {backgroundColor: pressed ? t.hi : t.bg, borderColor: t.border},
          ]}>
          <View style={[styles.badge, {backgroundColor: t.hi}]}>
            <Icon name="calendar" size={20} color={t.accent} />
          </View>
          <View style={styles.daylightText}>
            <Text weight="semibold" size={15} color={t.text}>
              {I18n.t('timetable.share', {month: monthName})}
            </Text>
            <Text size={13} color={t.muted}>
              {I18n.t('timetable.hint')}
            </Text>
          </View>
          {sharing ? <ActivityIndicator color={t.accent} /> : null}
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  scroll: {paddingBottom: 24},
  head: {paddingHorizontal: 20, gap: 4},
  title: {letterSpacing: -0.6},
  segment: {marginTop: 18, marginHorizontal: 20},
  table: {marginTop: 16, marginHorizontal: 16},
  tr: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8},
  th: {height: 40, borderBottomWidth: 1},
  td: {height: 56, borderBottomWidth: 1},
  lastRow: {borderBottomWidth: 0},
  dayCol: {width: 64, gap: 1},
  cell: {flex: 1, textAlign: 'center', fontVariant: ['tabular-nums']},
  caps: {letterSpacing: 0.4},
  daylight: {
    marginTop: 14,
    marginHorizontal: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  share: {
    marginTop: 14,
    marginHorizontal: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 44,
  },
  badge: {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  daylightText: {flex: 1, minWidth: 0, gap: 2},
  dayCard: {marginTop: 12, marginHorizontal: 16, padding: 16},
  listRow: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 8, paddingTop: 8},
  listName: {flex: 1, minWidth: 120},
  listTime: {fontVariant: ['tabular-nums']},
});

export default WeekScreen;
