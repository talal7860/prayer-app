import React from 'react';
import {Pressable, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Card, Row, SectionLabel} from '../../components/ui/Card';
import Icon from '../../components/ui/Icon';
import Segmented from '../../components/ui/Segmented';
import Text from '../../components/ui/Text';
import Toggle from '../../components/ui/Toggle';
import AppConstants from '../../AppConstants';
import useAppSettings from '../../hooks/useAppSettings';
import usePalette from '../../hooks/usePalette';
import I18n from '../../I18n';
import {formatCoords} from '../../lib/prayerDay';
import {isHighLatitude} from '../../lib/recommend';

const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const {t, isDark} = usePalette();
  const {settings, setSetting, calculationMethod} = useAppSettings();

  return (
    <View style={[styles.root, {backgroundColor: t.surface}]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={[styles.scroll, {paddingTop: insets.top + 24}]}>
        <Text weight="bold" size={30} color={t.text} accessibilityRole="header" style={styles.title}>
          {I18n.t('settings.title')}
        </Text>

        <SectionLabel>{I18n.t('settings.locationSection')}</SectionLabel>
        <Card style={styles.locationCard}>
          <View style={[styles.badge, {backgroundColor: t.hi}]}>
            <Icon name="pin" size={20} color={t.accent} />
          </View>
          <View style={styles.flex}>
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
          <Row title={I18n.t('settings.asr')} last>
            <Segmented
              accessibilityLabel={I18n.t('settings.asr')}
              options={[
                {value: 'Standard', label: 'Standard'},
                {value: 'Hanafi', label: 'Hanafi'},
              ]}
              value={settings.asr}
              onChange={setSetting('asr')}
            />
          </Row>
        </Card>

        <SectionLabel>{I18n.t('settings.notificationsSection')}</SectionLabel>
        <Card>
          <Row
            title={I18n.t('settings.adhan')}
            value={AppConstants.sounds?.[settings.sound]?.name}
            onPress={() => navigation.navigate('sound')}
          />
          <Row title={I18n.t('settings.headsUp')} subtitle={I18n.t('settings.headsUpHint')} last>
            <Toggle
              value={!!settings.headsUp}
              onChange={setSetting('headsUp')}
              accessibilityLabel={I18n.t('settings.headsUp')}
            />
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  scroll: {paddingHorizontal: 16, paddingBottom: 24},
  title: {paddingHorizontal: 4, paddingBottom: 6, letterSpacing: -0.6},
  locationCard: {flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16},
  badge: {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  flex: {flex: 1, minWidth: 0, gap: 2},
  link: {minHeight: 44, justifyContent: 'center', paddingHorizontal: 4},
});

export default SettingsScreen;
