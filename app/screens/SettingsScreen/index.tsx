import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import * as Application from 'expo-application';
import type {TabNavigation} from '../../navigation';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Card, Row, SectionLabel} from '../../components/ui/Card';
import Icon from '../../components/ui/Icon';
import Segmented from '../../components/ui/Segmented';
import Text from '../../components/ui/Text';
import Toggle from '../../components/ui/Toggle';
import AppConstants from '../../AppConstants';
import useAppSettings from '../../hooks/useAppSettings';
import useExactAlarms from '../../hooks/useExactAlarms';
import {scheduleTestNotification} from '../../lib/notifications';
import usePalette from '../../hooks/usePalette';
import I18n from '../../I18n';
import {formatCoords} from '../../lib/prayerDay';
import {isHighLatitude} from '../../lib/recommend';
import {adjustmentSummary} from './Adjust';
import useReadableWidth from '../../hooks/useReadableWidth';
import {isLargeText} from '../../lib/a11y';

/** "Version 1.2.0 (42)": the store version and the build number EAS gives each build. */
const versionLabel = (): string | null => {
  const version = Application.nativeApplicationVersion;
  if (!version) {
    return null;
  }
  const build = Application.nativeBuildVersion;
  return build ? I18n.t('settings.version', {version, build}) : version;
};

const SettingsScreen = () => {
  const column = useReadableWidth();
  const navigation = useNavigation<TabNavigation>();
  const insets = useSafeAreaInsets();
  const {t, isDark} = usePalette();
  const {settings, setSetting, calculationMethod} = useAppSettings();
  const exactAlarms = useExactAlarms();
  // At large text sizes the location card stacks, so the city isn't squeezed to a letter.
  const {fontScale} = useWindowDimensions();
  const big = isLargeText(fontScale);
  const version = versionLabel();
  const sendTest = () => {
    scheduleTestNotification(settings)
      .then(sent => {
        Alert.alert(
          I18n.t(sent ? 'settings.testNotificationSent' : 'settings.testNotificationOff'),
        );
      })
      .catch((error: unknown) => {
        Alert.alert(String(error));
      });
  };

  return (
    <View style={[styles.root, {backgroundColor: t.surface}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={[styles.scroll, {paddingTop: insets.top + 24}, column]}>
        <Text
          weight="bold"
          size={30}
          // Already large: past 2× a word like "Settings" no longer fits a line and breaks.
          maxFontSizeMultiplier={2}
          color={t.text}
          accessibilityRole="header"
          style={styles.title}>
          {I18n.t('settings.title')}
        </Text>

        <SectionLabel>{I18n.t('settings.locationSection')}</SectionLabel>
        <Card style={big ? {...styles.locationCard, ...styles.stacked} : styles.locationCard}>
          <View style={[styles.badge, {backgroundColor: t.hi}]}>
            <Icon name="pin" size={20} color={t.accent} />
          </View>
          <View style={big ? styles.stackedText : styles.flex} accessible>
            <Text weight="semibold" size={16} color={t.text} numberOfLines={1}>
              {settings.city ?? I18n.t('settings.unknownCity')}
            </Text>
            <Text size={13} color={t.muted}>
              {formatCoords(settings.location)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${I18n.t('settings.change')} ${I18n.t('settings.locationSection')}`}
            onPress={() => navigation.navigate('location')}
            style={styles.link}>
            <Text weight="semibold" size={15} color={t.accent}>
              {I18n.t('settings.change')}
            </Text>
          </Pressable>
        </Card>

        <SectionLabel>{I18n.t('settings.calculationSection')}</SectionLabel>
        <Card>
          <Row
            title={I18n.t('settings.method')}
            subtitle={calculationMethod()}
            onPress={() => navigation.navigate('method')}
          />
          {isHighLatitude(settings.location) ? (
            <Row
              title={I18n.t('settings.highLats')}
              subtitle={I18n.t(`highLats.${settings.highLats}`)}
              onPress={() => navigation.navigate('highLats')}
            />
          ) : null}
          <Row
            title={I18n.t('settings.adjust')}
            subtitle={adjustmentSummary(settings.adjustments)}
            onPress={() => navigation.navigate('adjust')}
          />
          <Row title={I18n.t('settings.asr')} last>
            <Segmented
              accessibilityLabel={I18n.t('settings.asr')}
              options={[
                {value: 'Standard', label: I18n.t('asrNames.Standard')},
                {value: 'Hanafi', label: I18n.t('asrNames.Hanafi')},
              ]}
              value={settings.asr}
              onChange={setSetting('asr')}
            />
          </Row>
        </Card>

        <SectionLabel>{I18n.t('settings.notificationsSection')}</SectionLabel>
        <Card>
          {exactAlarms.needed ? (
            // Android 12+: without "Alarms & reminders" the adhan can be late.
            <Row title={I18n.t('exactAlarm.title')} subtitle={I18n.t('exactAlarm.settingsHint')}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${I18n.t('exactAlarm.allow')}: ${I18n.t('exactAlarm.title')}`}
                accessibilityHint={I18n.t('exactAlarm.settingsHint')}
                hitSlop={5}
                onPress={exactAlarms.allow}
                style={({pressed}) => [
                  styles.allow,
                  {backgroundColor: t.accent, opacity: pressed ? 0.85 : 1},
                ]}>
                <Text weight="semibold" size={14} color={t.onAccent}>
                  {I18n.t('exactAlarm.allow')}
                </Text>
              </Pressable>
            </Row>
          ) : null}
          <Row
            title={I18n.t('settings.adhan')}
            value={AppConstants.soundName(settings.sound)}
            onPress={() => navigation.navigate('sound')}
          />
          <Row title={I18n.t('settings.headsUp')} subtitle={I18n.t('settings.headsUpHint')}>
            <Toggle
              value={settings.headsUp}
              onChange={setSetting('headsUp')}
              accessibilityLabel={I18n.t('settings.headsUp')}
              accessibilityHint={I18n.t('settings.headsUpHint')}
            />
          </Row>
          {Platform.OS === 'ios' && (
            <Row
              title={I18n.t('settings.liveActivity')}
              subtitle={I18n.t('settings.liveActivityHint')}>
              <Toggle
                value={settings.liveActivity}
                onChange={setSetting('liveActivity')}
                accessibilityLabel={I18n.t('settings.liveActivity')}
                accessibilityHint={I18n.t('settings.liveActivityHint')}
              />
            </Row>
          )}
          <Row
            title={I18n.t('settings.testNotification')}
            subtitle={I18n.t('settings.testNotificationHint')}
            last>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${I18n.t('settings.testNotificationSend')}: ${I18n.t('settings.testNotification')}`}
              accessibilityHint={I18n.t('settings.testNotificationHint')}
              hitSlop={5}
              onPress={sendTest}
              style={({pressed}) => [
                styles.allow,
                {backgroundColor: t.accent, opacity: pressed ? 0.85 : 1},
              ]}>
              <Text weight="semibold" size={14} color={t.onAccent}>
                {I18n.t('settings.testNotificationSend')}
              </Text>
            </Pressable>
          </Row>
        </Card>

        <SectionLabel>{I18n.t('settings.displaySection')}</SectionLabel>
        <Card>
          <Row title={I18n.t('settings.timeFormat')} last>
            <Segmented
              minWidth={64}
              accessibilityLabel={I18n.t('settings.timeFormat')}
              options={[
                {value: '12h', label: '12h'},
                {value: '24h', label: '24h'},
              ]}
              value={settings.timeFormat}
              onChange={setSetting('timeFormat')}
            />
          </Row>
        </Card>

        {version ? (
          <Text size={13} color={t.muted} selectable style={styles.version}>
            {version}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  scroll: {paddingHorizontal: 16, paddingBottom: 24},
  // 34pt pill + 5pt hitSlop above and below = a 44pt target.
  allow: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 34,
    borderRadius: 17,
    justifyContent: 'center',
  },
  title: {paddingHorizontal: 4, paddingBottom: 6, letterSpacing: -0.6},
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  badge: {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  flex: {flex: 1, minWidth: 0, gap: 2},
  stacked: {flexDirection: 'column', alignItems: 'flex-start'},
  stackedText: {alignSelf: 'stretch', gap: 2},
  link: {minHeight: 44, justifyContent: 'center', paddingHorizontal: 4},
  version: {textAlign: 'center', paddingTop: 24},
});

export default SettingsScreen;
