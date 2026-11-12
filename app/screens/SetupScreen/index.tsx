import React, {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Card, Row} from '../../components/ui/Card';
import ChoiceList from '../../components/ui/ChoiceList';
import Icon from '../../components/ui/Icon';
import Text from '../../components/ui/Text';
import Toggle from '../../components/ui/Toggle';
import useAppSettings from '../../hooks/useAppSettings';
import useLocate from '../../hooks/useLocate';
import usePalette from '../../hooks/usePalette';
import I18n from '../../I18n';
import {searchPlace, type Place} from '../../lib/geocode';
import {formatCoords, formatTime} from '../../lib/prayerDay';
import {METHOD_KEYS, methodName, prayerTimesFor} from '../../lib/prayerTimes';
import {isHighLatitude, recommendedAsr, recommendedMethod} from '../../lib/recommend';
import {fonts, radius} from '../../theme/tokens';
import {highLatOptions} from '../SettingsScreen/HighLats';

type Step = 'location' | 'method' | 'asr' | 'highLats' | 'review';

type Draft = Pick<Settings, 'calculationMethod' | 'asr' | 'highLats' | 'liveActivity'> & {
  location?: GeoLocation;
  city?: string;
};

/**
 * First-run setup: everything that changes the calculated times (location, method,
 * Asr, and the high-latitude rule where it matters), then a preview of today's times.
 * Nothing is saved until Start, so quitting halfway shows the setup again next time.
 */
const SetupScreen = () => {
  const {t, isDark} = usePalette();
  const insets = useSafeAreaInsets();
  const {settings, setSettings} = useAppSettings();
  const {locate, busy} = useLocate();
  const [draft, setDraft] = useState<Draft>({
    calculationMethod: settings.calculationMethod,
    asr: settings.asr,
    highLats: settings.highLats,
    liveActivity: settings.liveActivity,
  });
  const [place, setPlace] = useState<Place>({});
  const [touched, setTouched] = useState({method: false, asr: false});
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const steps: Step[] = useMemo(
    () => [
      'location',
      'method',
      'asr',
      ...(draft.location && isHighLatitude(draft.location) ? ['highLats' as const] : []),
      'review',
    ],
    [draft.location],
  );
  const step = steps[Math.min(index, steps.length - 1)];
  const isLast = index >= steps.length - 1;

  // A new place preselects what's common there, unless the user already chose.
  const choosePlace = (location: GeoLocation, found: Place) => {
    setPlace(found);
    setNotFound(null);
    setDraft(d => ({
      ...d,
      location,
      city: found.city,
      calculationMethod: touched.method
        ? d.calculationMethod
        : recommendedMethod(found.countryCode),
      asr: touched.asr ? d.asr : recommendedAsr(found.countryCode),
    }));
  };

  const locateMe = async () => {
    const found = await locate();
    if (found) {
      choosePlace(found.location, found.place);
    }
  };

  const search = async () => {
    if (!query.trim()) {
      return;
    }
    setSearching(true);
    const found = await searchPlace(query);
    setSearching(false);
    if (found) {
      choosePlace(found.location, found.place);
    } else {
      setNotFound(query.trim());
    }
  };

  const finish = () =>
    setSettings(prev => ({
      ...prev,
      calculationMethod: draft.calculationMethod,
      asr: draft.asr,
      highLats: draft.highLats,
      liveActivity: draft.liveActivity,
      location: draft.location ?? prev.location,
      city: draft.city,
      onboarded: true,
    }));

  const next = () => (isLast ? finish() : setIndex(i => i + 1));
  const canContinue = step !== 'location' || !!draft.location;

  const recommendedLabel = place.country
    ? I18n.t('setup.recommended', {country: place.country})
    : I18n.t('setup.recommendedHere');
  const suggestedMethod = place.countryCode ? recommendedMethod(place.countryCode) : null;
  const suggestedAsr = place.countryCode ? recommendedAsr(place.countryCode) : null;

  const preview = useMemo(
    () => (draft.location ? prayerTimesFor({...draft, location: draft.location}, new Date()) : []),
    [draft],
  );

  const header = {
    location: [I18n.t('setup.locationTitle'), I18n.t('setup.locationHint')],
    method: [I18n.t('setup.methodTitle'), I18n.t('setup.methodHint')],
    asr: [I18n.t('setup.asrTitle'), I18n.t('setup.asrHint')],
    highLats: [I18n.t('highLats.title'), I18n.t('highLats.hint')],
    review: [I18n.t('setup.reviewTitle'), I18n.t('setup.reviewHint')],
  }[step];

  return (
    <KeyboardAvoidingView
      style={[styles.root, {backgroundColor: t.surface}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.top, {paddingTop: insets.top + 12}]}>
        <View
          style={styles.progress}
          accessibilityLabel={I18n.t('setup.step', {n: index + 1, total: steps.length})}>
          {steps.map((s, i) => (
            <View
              key={s}
              style={[styles.dash, {backgroundColor: i <= index ? t.accent : t.track}]}
            />
          ))}
        </View>
        {index > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={I18n.t('setup.back')}
            onPress={() => setIndex(i => i - 1)}
            hitSlop={12}
            style={styles.back}>
            <Icon name="back" size={22} color={t.accent} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {step === 'location' ? (
          <Text weight="medium" size={15} color={t.accent} style={styles.welcome}>
            {I18n.t('setup.welcome')}
          </Text>
        ) : null}
        <Text
          weight="bold"
          size={28}
          color={t.text}
          accessibilityRole="header"
          style={styles.title}>
          {header[0]}
        </Text>
        <Text size={15} color={t.muted} style={styles.hint}>
          {header[1]}
        </Text>

        {step === 'location' ? (
          <View style={styles.gap}>
            {draft.location ? (
              <Card style={styles.placeCard}>
                <View style={[styles.badge, {backgroundColor: t.hi}]}>
                  <Icon name="pin" size={20} color={t.accent} />
                </View>
                <View style={styles.flex}>
                  <Text weight="semibold" size={16} color={t.text}>
                    {draft.city ?? I18n.t('settings.unknownCity')}
                  </Text>
                  <Text size={13} color={t.muted}>
                    {formatCoords(draft.location)}
                  </Text>
                </View>
                <Icon name="check" size={20} color={t.accent} strokeWidth={2.2} />
              </Card>
            ) : null}
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={locateMe}
              style={({pressed}) => [
                styles.button,
                {
                  backgroundColor: draft.location ? t.hi : t.accent,
                  opacity: pressed || busy ? 0.8 : 1,
                },
              ]}>
              {busy ? (
                <ActivityIndicator color={draft.location ? t.accent : t.onAccent} />
              ) : (
                <Icon
                  name="navigate"
                  size={18}
                  color={draft.location ? t.accent : t.onAccent}
                  strokeWidth={2}
                />
              )}
              <Text weight="semibold" size={15} color={draft.location ? t.accent : t.onAccent}>
                {I18n.t('setup.useCurrent')}
              </Text>
            </Pressable>
            <View style={[styles.searchRow, {backgroundColor: t.bg, borderColor: t.border}]}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={search}
                placeholder={I18n.t('setup.searchPlaceholder')}
                placeholderTextColor={t.muted}
                returnKeyType="search"
                autoCorrect={false}
                accessibilityLabel={I18n.t('setup.searchPlaceholder')}
                style={[styles.input, {color: t.text}]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={I18n.t('setup.search')}
                onPress={search}
                disabled={searching}
                style={styles.searchButton}>
                {searching ? (
                  <ActivityIndicator color={t.accent} />
                ) : (
                  <Text weight="semibold" size={15} color={t.accent}>
                    {I18n.t('setup.search')}
                  </Text>
                )}
              </Pressable>
            </View>
            {notFound ? (
              <Text size={13} color={t.muted} style={styles.hint}>
                {I18n.t('setup.notFound', {query: notFound})}
              </Text>
            ) : null}
          </View>
        ) : null}

        {step === 'method' ? (
          <ChoiceList
            options={METHOD_KEYS.map(key => ({
              value: key,
              label: methodName(key),
              detail: key === suggestedMethod ? recommendedLabel : undefined,
            }))}
            value={draft.calculationMethod}
            onChange={calculationMethod => {
              setTouched(x => ({...x, method: true}));
              setDraft(d => ({...d, calculationMethod}));
            }}
          />
        ) : null}

        {step === 'asr' ? (
          <ChoiceList
            options={(['Standard', 'Hanafi'] as AsrJuristics[]).map(value => ({
              value,
              label: I18n.t(`setup.asr${value}`),
              detail:
                I18n.t(`setup.asr${value}Detail`) +
                (value === suggestedAsr ? ` · ${recommendedLabel}` : ''),
            }))}
            value={draft.asr}
            onChange={asr => {
              setTouched(x => ({...x, asr: true}));
              setDraft(d => ({...d, asr}));
            }}
          />
        ) : null}

        {step === 'highLats' ? (
          <ChoiceList
            options={highLatOptions()}
            value={draft.highLats}
            onChange={highLats => setDraft(d => ({...d, highLats}))}
          />
        ) : null}

        {step === 'review' ? (
          <View style={styles.gap}>
            <Card>
              {preview.map((p, i) => (
                <View
                  key={p.key}
                  style={[
                    styles.timeRow,
                    i < preview.length - 1 && {borderBottomWidth: 1, borderBottomColor: t.divider},
                  ]}>
                  <Text weight="medium" size={15} color={t.text}>
                    {p.label}
                  </Text>
                  <Text weight="semibold" size={15} color={t.text} style={styles.tabular}>
                    {formatTime(p.time, settings.timeFormat)}
                  </Text>
                </View>
              ))}
            </Card>
            <Text size={13} color={t.muted} style={styles.hint}>
              {[draft.city, methodName(draft.calculationMethod), I18n.t(`setup.asr${draft.asr}`)]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            {Platform.OS === 'ios' ? (
              // Opt-in: the countdown on the lock screen and in the Dynamic Island.
              <Card>
                <Row
                  title={I18n.t('settings.liveActivity')}
                  subtitle={I18n.t('setup.liveActivityHint')}
                  last>
                  <Toggle
                    value={!!draft.liveActivity}
                    onChange={liveActivity => setDraft(d => ({...d, liveActivity}))}
                    accessibilityLabel={I18n.t('settings.liveActivity')}
                  />
                </Row>
              </Card>
            ) : null}
            <Text size={13} color={t.muted} style={styles.hint}>
              {I18n.t('setup.notifyHint')}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, {paddingBottom: insets.bottom + 16}]}>
        {!canContinue ? (
          <Text size={13} color={t.muted} style={styles.footerHint}>
            {I18n.t('setup.locationNeeded')}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{disabled: !canContinue}}
          disabled={!canContinue}
          onPress={next}
          style={({pressed}) => [
            styles.button,
            {backgroundColor: canContinue ? t.accent : t.track, opacity: pressed ? 0.85 : 1},
          ]}>
          <Text weight="semibold" size={16} color={canContinue ? t.onAccent : t.muted}>
            {I18n.t(isLast ? 'setup.finish' : 'setup.continue')}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  top: {paddingHorizontal: 20, gap: 14, minHeight: 64},
  progress: {flexDirection: 'row', gap: 6},
  dash: {flex: 1, height: 4, borderRadius: 2},
  back: {alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center'},
  scroll: {paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 6},
  welcome: {paddingHorizontal: 4},
  title: {paddingHorizontal: 4, letterSpacing: -0.6},
  hint: {paddingHorizontal: 4, paddingBottom: 12, lineHeight: 21},
  gap: {gap: 12},
  placeCard: {flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16},
  badge: {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  flex: {flex: 1, minWidth: 0, gap: 2},
  button: {
    height: 52,
    borderRadius: radius.row,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchRow: {
    height: 52,
    borderRadius: radius.row,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  input: {flex: 1, fontFamily: fonts.regular, fontSize: 15, height: '100%'},
  searchButton: {paddingHorizontal: 16, height: '100%', justifyContent: 'center'},
  timeRow: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabular: {fontVariant: ['tabular-nums']},
  footer: {paddingHorizontal: 16, paddingTop: 8, gap: 8},
  footerHint: {textAlign: 'center'},
});

export default SetupScreen;
