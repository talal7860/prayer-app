import {Box, Column, Row, Text} from '@expo/ui/jetpack-compose';
import {
  background,
  cornerRadius,
  fillMaxSize,
  fillMaxWidth,
  padding,
  paddingAll,
  width,
} from '@expo/ui/jetpack-compose/modifiers';
import {createWidget} from 'expo-widgets';
import type {NextPrayerProps} from './types';

// The medium widget from the "Widgets & lock screen" board (#34), as far as Android widgets
// go: no gradients or rings, so it's the period's sky colour, the next prayer with a ticking
// countdown, and the day's times. Runs in the widget's own JS runtime: no hooks, imports or
// module values.
//
// The countdown is a `ChronometerView`: a native Chronometer added by our expo-widgets patch
// (patches/expo-widgets+*.patch). The system ticks it every second, and when it reaches zero
// the patch re-renders the widget. Each render picks the entry for `Date.now()` from
// `p.entries` (every prayer time for two days), so the widget moves on without the app.
//
// Android widgets are Glance (RemoteViews) underneath, and expo-widgets maps only part of
// Compose: no `weight`, no spaceBetween/spaceEvenly, and the layout isn't told the widget's
// size. So things are placed with Box layers (city start / Hijri date end, chips at the
// bottom) and the chips have a fixed width, centred as a group.
const NextPrayer = (snapshot: NextPrayerProps) => {
  'widget';
  // Not a React component: this runs once per widget render, and reading the clock is the point.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  let p = snapshot;
  for (const entry of snapshot.entries ?? []) {
    if (entry.from <= now) {
      p = entry.props;
    }
  }
  // A native view from the expo-widgets patch: its JSX type is the view name.
  const Countdown = 'ChronometerView' as unknown as (props: {
    at: number;
    color: string;
    fontSize: number;
    modifiers?: ReturnType<typeof fillMaxWidth>[];
  }) => null;
  const white = '#FFFFFF';
  const soft = '#DCE6FF';
  const gold = '#FFE7A3';
  return (
    <Box modifiers={[fillMaxSize(), background(p.sky[0]), paddingAll(16)]}>
      {/* Top: city at the start, the short Hijri date at the end. */}
      <Box modifiers={[fillMaxWidth()]}>
        <Text color={soft} maxLines={1} style={{fontSize: 13}}>
          {p.city}
        </Text>
      </Box>
      <Box contentAlignment="topEnd" modifiers={[fillMaxWidth()]}>
        <Text color={soft} maxLines={1} style={{fontSize: 13}}>
          {p.hijriShort}
        </Text>
      </Box>

      {/* The next prayer and a ticking countdown to it, under the top row. */}
      <Column modifiers={[fillMaxWidth(), padding(0, 26, 0, 0)]}>
        <Text color={white} maxLines={1} style={{fontSize: 15, fontWeight: '600'}}>
          {p.inLabel}
        </Text>
        <Countdown at={p.at} color={white} fontSize={34} modifiers={[fillMaxWidth()]} />
        <Text color={soft} maxLines={1} style={{fontSize: 13}}>
          {p.atLabel}
        </Text>
      </Column>

      {/* The day's five prayers along the bottom; the next one highlighted. */}
      <Box contentAlignment="bottomCenter" modifiers={[fillMaxSize()]}>
        <Row
          horizontalAlignment="center"
          modifiers={[
            fillMaxWidth(),
            background('rgba(0,0,0,0.22)'),
            cornerRadius(14),
            paddingAll(4),
          ]}>
          {p.prayers.map(r => (
            <Column
              key={r.label}
              horizontalAlignment="center"
              modifiers={[
                width(58),
                padding(0, 6, 0, 6),
                cornerRadius(10),
                background(r.next ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0)'),
              ]}>
              <Text
                color={r.next ? gold : soft}
                maxLines={1}
                style={{fontSize: 10, fontWeight: '600'}}>
                {r.label.toUpperCase()}
              </Text>
              <Text
                color={white}
                maxLines={1}
                style={{fontSize: 14, fontWeight: r.next ? 'bold' : 'normal'}}>
                {r.hm}
              </Text>
            </Column>
          ))}
        </Row>
      </Box>
    </Box>
  );
};

export default createWidget('NextPrayer', NextPrayer);
