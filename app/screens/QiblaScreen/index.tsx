import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {Card, Row} from '../../components/ui/Card';
import Icon from '../../components/ui/Icon';
import Text from '../../components/ui/Text';
import useAppSettings from '../../hooks/useAppSettings';
import useHeading from '../../hooks/useHeading';
import usePalette from '../../hooks/usePalette';
import I18n from '../../I18n';
import {formatCoords} from '../../lib/prayerDay';
import {
  formatKm,
  isFacing,
  needsCalibration,
  qiblaBearing,
  qiblaDistanceKm,
  qiblaOffset,
  unwrap,
} from '../../lib/qibla';
import {kaaba, type Palette} from '../../theme/tokens';

const TICKS = Array.from({length: 72}, (_, i) => i * 5);
const CARDINALS = [
  {deg: 0, key: 'n'},
  {deg: 90, key: 'e'},
  {deg: 180, key: 's'},
  {deg: 270, key: 'w'},
] as const;
/** How far in from the rim the Kaaba sits (inside the letters) and the needle starts. */
const KAABA_AT = 46;
const KAABA_SIZE = 30;
const NEEDLE_FROM = KAABA_AT + KAABA_SIZE + 4;
/** How long the calibration steps stay up after Recalibrate. */
const CALIBRATE_FOR_MS = 15000;

/** A full-size layer turned by `deg` around the dial's centre; children sit at its top. */
const Spoke = ({deg, children}: React.PropsWithChildren<{deg: number}>) => (
  <View
    pointerEvents="none"
    style={[StyleSheet.absoluteFill, styles.spoke, {transform: [{rotate: `${deg}deg`}]}]}>
    {children}
  </View>
);

type DialProps = {
  size: number;
  rotation: Animated.Value;
  bearing: number;
  facing: boolean;
  t: Palette;
};

/**
 * The compass rose turns by −heading so its N points at north, and the Kaaba sits on it at the
 * qibla bearing. The pointer at the top is the way the phone faces. It's a map of real
 * directions, so it doesn't mirror in right-to-left layouts.
 */
const Dial = ({size, rotation, bearing, facing, t}: DialProps) => {
  const ring = facing ? t.accent : t.border;
  // Extrapolates past ±360, so the unwrapped angle never needs resetting.
  const rotate = rotation.interpolate({inputRange: [0, 360], outputRange: ['0deg', '-360deg']});
  return (
    <View style={[styles.dialWrap, {width: size, height: size + 18}]}>
      {/* The phone's direction. */}
      <View style={[styles.pointer, {borderBottomColor: facing ? t.accent : t.text}]} />
      <View
        style={[
          styles.dial,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: facing ? t.hi : t.bg,
            borderColor: ring,
            borderWidth: facing ? 3 : 1.5,
          },
        ]}>
        <Animated.View style={[StyleSheet.absoluteFill, {transform: [{rotate}]}]}>
          {TICKS.map(deg => {
            const major = deg % 30 === 0;
            return (
              <Spoke key={deg} deg={deg}>
                <View
                  style={[
                    styles.tick,
                    {
                      height: major ? 12 : 6,
                      width: major ? 2 : 1,
                      backgroundColor: major ? t.muted : t.trackOff,
                    },
                  ]}
                />
              </Spoke>
            );
          })}
          {CARDINALS.map(({deg, key}) => (
            <Spoke key={key} deg={deg}>
              <Text
                weight={key === 'n' ? 'bold' : 'semibold'}
                size={15}
                color={key === 'n' ? t.accent : t.muted}
                style={styles.cardinal}>
                {I18n.t(`qibla.${key}`)}
              </Text>
            </Spoke>
          ))}
          {/* The qibla: a needle from the centre to the Kaaba on the rim. */}
          <Spoke deg={bearing}>
            <View
              style={[
                styles.needle,
                {height: size / 2 - NEEDLE_FROM, marginTop: NEEDLE_FROM, backgroundColor: facing ? t.accent : t.text},
              ]}
            />
          </Spoke>
          <Spoke deg={bearing}>
            <View style={styles.kaaba}>
              <View style={styles.kaabaBand} />
            </View>
          </Spoke>
        </Animated.View>
        <View style={[styles.hub, {backgroundColor: facing ? t.accent : t.text, borderColor: t.bg}]} />
      </View>
    </View>
  );
};

const QiblaScreen = () => {
  const {t} = usePalette();
  const {width} = useWindowDimensions();
  const {settings} = useAppSettings();
  const {status, heading, accuracy, canAskAgain, allow, recalibrate} = useHeading();
  // After Recalibrate, the figure-8 steps stay up for a while even if the phone reports a
  // good accuracy: that's when you'd follow them.
  const [calibrating, setCalibrating] = useState(false);
  useEffect(() => {
    if (!calibrating) {
      return;
    }
    const timer = setTimeout(() => setCalibrating(false), CALIBRATE_FOR_MS);
    return () => clearTimeout(timer);
  }, [calibrating]);
  const startCalibrating = () => {
    setCalibrating(true);
    recalibrate();
  };

  const bearing = useMemo(() => qiblaBearing(settings.location), [settings.location]);
  const distance = useMemo(() => qiblaDistanceKm(settings.location), [settings.location]);
  const live = status === 'ok' && heading !== null;
  const offset = live ? qiblaOffset(bearing, heading) : null;

  // Facing, with hysteresis (starts at ±5°, stops past ±8°), so it needs the last value.
  const [facing, setFacing] = useState(false);
  const nowFacing = offset !== null && isFacing(offset, facing);
  if (nowFacing !== facing) {
    setFacing(nowFacing);
  }
  // A light tap when you turn onto the qibla, so you can feel it without watching the screen.
  useEffect(() => {
    if (facing) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [facing]);

  // Turn the dial the short way round (359° → 1° is +2°, not −358°).
  const [rotation] = useState(() => new Animated.Value(0));
  const angle = useRef(0);
  useEffect(() => {
    const target = unwrap(angle.current, live ? heading : 0);
    angle.current = target;
    Animated.timing(rotation, {
      toValue: target,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [heading, live, rotation]);
  const deg = Math.round(bearing);
  const city = settings.city ?? formatCoords(settings.location);
  const size = Math.min(width - 64, 320);

  let headline: string;
  let headColor = t.text;
  if (status === 'starting') {
    headline = I18n.t('qibla.starting');
    headColor = t.muted;
  } else if (status === 'denied') {
    headline = I18n.t('qibla.deniedTitle');
  } else if (status === 'unavailable') {
    headline = I18n.t('qibla.noCompassTitle');
  } else if (facing) {
    headline = I18n.t('qibla.facing');
    headColor = t.accent;
  } else {
    const turn = Math.round(Math.abs(offset ?? 0));
    headline = I18n.t((offset ?? 0) > 0 ? 'qibla.turnRight' : 'qibla.turnLeft', {deg: turn});
  }

  return (
    <ScrollView
      style={{backgroundColor: t.surface}}
      contentContainerStyle={styles.scroll}>
      <View style={styles.head} accessible accessibilityLiveRegion="polite">
        {facing ? <Icon name="check" size={26} color={t.accent} strokeWidth={2.4} /> : null}
        <Text weight="semibold" size={22} color={headColor} style={styles.center}>
          {headline}
        </Text>
        {status === 'starting' ? <ActivityIndicator color={t.muted} /> : null}
      </View>

      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${I18n.t('qibla.dial')}: ${I18n.t('qibla.bearing', {deg})}`}>
        <Dial size={size} rotation={rotation} bearing={bearing} facing={facing} t={t} />
      </View>

      {status === 'denied' ? (
        <Card>
          <View style={styles.noteBody}>
            <Text size={14} color={t.muted}>{I18n.t('qibla.deniedBody')}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={allow}
              style={({pressed}) => [styles.button, {backgroundColor: t.accent, opacity: pressed ? 0.85 : 1}]}>
              <Text weight="semibold" size={15} color={t.onAccent}>
                {I18n.t(canAskAgain ? 'qibla.allow' : 'locations.goToSettings')}
              </Text>
            </Pressable>
          </View>
        </Card>
      ) : null}
      {status === 'unavailable' ? (
        <Card>
          <Text size={14} color={t.muted} style={styles.noteBody}>
            {I18n.t('qibla.noCompassBody', {deg})}
          </Text>
        </Card>
      ) : null}
      {calibrating || (live && needsCalibration(accuracy)) ? (
        <Card>
          <View style={styles.noteBody}>
            <Text weight="semibold" size={15} color={t.text}>{I18n.t('qibla.calibrateTitle')}</Text>
            <Text size={14} color={t.muted}>{I18n.t('qibla.calibrateBody')}</Text>
          </View>
        </Card>
      ) : null}

      <Card>
        <Row title={I18n.t('qibla.direction')} value={I18n.t('qibla.bearing', {deg})} />
        <Row title={I18n.t('qibla.distance')} value={I18n.t('qibla.km', {km: formatKm(distance)})} />
        <Row title={I18n.t('qibla.from')} value={city} last />
      </Card>
      {live ? (
        <Text size={13} color={t.muted} style={[styles.center, styles.tip]}>
          {I18n.t('qibla.tip')}
        </Text>
      ) : null}
      {status === 'ok' || status === 'unavailable' ? (
        <Pressable
          accessibilityRole="button"
          onPress={startCalibrating}
          style={({pressed}) => [styles.button, styles.outline, {borderColor: t.border, opacity: pressed ? 0.7 : 1}]}>
          <Text weight="semibold" size={15} color={t.accent}>
            {I18n.t('qibla.recalibrate')}
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {padding: 16, paddingBottom: 32, alignItems: 'stretch', gap: 16},
  head: {minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 8},
  center: {textAlign: 'center'},
  dialWrap: {alignSelf: 'center', alignItems: 'center'},
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: 4,
  },
  dial: {overflow: 'hidden', alignItems: 'center', justifyContent: 'center'},
  spoke: {alignItems: 'center'},
  tick: {marginTop: 6, borderRadius: 1},
  cardinal: {marginTop: 20},
  needle: {width: 3, borderRadius: 2},
  kaaba: {
    marginTop: KAABA_AT,
    width: KAABA_SIZE,
    height: KAABA_SIZE,
    borderRadius: 5,
    backgroundColor: kaaba.body,
    borderWidth: 1,
    borderColor: kaaba.edge,
  },
  kaabaBand: {marginTop: 7, height: 4, backgroundColor: kaaba.band},
  hub: {position: 'absolute', width: 16, height: 16, borderRadius: 8, borderWidth: 3},
  noteBody: {padding: 16, gap: 10},
  button: {height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  tip: {paddingHorizontal: 16},
  outline: {borderWidth: 1},
});

export default QiblaScreen;
