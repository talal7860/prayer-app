import React from 'react';
import {I18nManager, StyleSheet, View} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';
import {arcFraction, PRAYER_KEYS, semiArcPoint, type DayTimes} from '../../lib/prayerDay';

type Props = React.PropsWithChildren<{
  width: number;
  now: Date;
  today: DayTimes;
  next: {key: PrayerKey; time: Date};
  /** The cover screen draws the dots bigger than the iPad. */
  size: 'cover' | 'wide';
  /** Where the overlay (the countdown) starts, from the top of the arc. */
  overlayTop: number;
}>;

const DOTS = {
  cover: {next: 11, other: 7, ring: 6, line: 2, dash: '4 8', sun: 20, sunCore: 12},
  wide: {next: 9, other: 5.5, ring: 5, line: 1.8, dash: '3 7', sun: 18, sunCore: 10},
};

/**
 * The cover and iPad boards' semicircle: Fajr at one end, Isha at the other, a dot per time
 * (the next one bigger and ringed, past ones faded) and the sun on it in daylight.
 * Time runs with the reading direction, so it's mirrored in Arabic and Urdu.
 */
const SemiArc = ({width, now, today, next, size, overlayTop, children}: Props) => {
  const d = DOTS[size];
  const mirror = (p: {x: number; y: number}) => (I18nManager.isRTL ? {x: 600 - p.x, y: p.y} : p);
  const nextToday = next.time.toDateString() === now.toDateString();
  const marks = PRAYER_KEYS.map(key => {
    const isNext = nextToday && next.key === key;
    const past = !isNext && today[key].getTime() <= now.getTime();
    return {key, isNext, past, ...mirror(semiArcPoint(arcFraction(today[key], today)))};
  });
  const sunUp =
    now.getTime() >= today.sunrise.getTime() && now.getTime() <= today.maghrib.getTime();
  const sun = mirror(semiArcPoint(arcFraction(now, today)));
  const height = width / 2;

  return (
    <View style={{width, height}}>
      <Svg width={width} height={height} viewBox="0 0 600 300" fill="none" aria-hidden>
        <Path
          d="M20 290 A280 270 0 0 1 580 290"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={d.line}
          strokeDasharray={d.dash}
        />
        <Path d="M0 290 H600" stroke="rgba(255,255,255,0.3)" strokeWidth={d.line * 0.7} />
        {marks.map(m => (
          <Circle
            key={m.key}
            cx={m.x}
            cy={m.y}
            r={m.isNext ? d.next : d.other}
            fill={
              m.isNext ? '#FFFFFF' : m.past ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.9)'
            }
            stroke={m.isNext ? 'rgba(255,255,255,0.35)' : 'none'}
            strokeWidth={d.ring}
          />
        ))}
        {sunUp ? (
          <>
            <Circle cx={sun.x} cy={sun.y} r={d.sun} fill="rgba(255,231,163,0.28)" />
            <Circle cx={sun.x} cy={sun.y} r={d.sunCore} fill="#FFE7A3" />
          </>
        ) : null}
      </Svg>
      <View style={[styles.overlay, {top: overlayTop}]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 4},
});

export default SemiArc;
