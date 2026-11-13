import {Box, Column, Row, Text} from '@expo/ui/jetpack-compose';
import {
  background,
  cornerRadius,
  fillMaxSize,
  fillMaxWidth,
  height,
  padding,
  paddingAll,
  size,
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
// bottom) and the chips have a fixed width, centred as a group. A Glance container holds at
// most 10 children, so the arc's dots go in groups of 9.
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
    align?: 'start' | 'center';
    modifiers?: ReturnType<typeof fillMaxWidth>[];
  }) => null;
  const white = '#FFFFFF';
  const soft = '#DCE6FF';
  const gold = '#FFE7A3';

  // The iOS widget's sun arc: a dotted half-ellipse from Fajr (start) to Isha (end), a mark per
  // prayer and the sun. No paths on Android, so every dot is a small rounded Box, placed with
  // padding inside a fixed-size Box.
  const arcW = 264;
  const arcH = 74;
  const point = (t: number) => {
    const a = Math.PI * (1 - t);
    return {
      x: arcW / 2 + (arcW / 2 - 6) * Math.cos(a),
      y: arcH - 4 - (arcH - 10) * Math.sin(a),
    };
  };
  const dots: {key: string; t: number; d: number; color: string}[] = [];
  for (let i = 0; i <= 22; i++) {
    dots.push({key: `d${String(i)}`, t: i / 22, d: 3, color: 'rgba(255,255,255,0.45)'});
  }
  p.marks.forEach((m, i) => {
    dots.push({
      key: `m${String(i)}`,
      t: m.t,
      d: m.next ? 11 : 7,
      color: m.next ? white : m.past ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.9)',
    });
  });
  if (p.sunT >= 0) {
    dots.push({key: 'glow', t: p.sunT, d: 18, color: 'rgba(255,231,163,0.3)'});
    dots.push({key: 'sun', t: p.sunT, d: 10, color: gold});
  }
  const groups: (typeof dots)[] = [];
  for (let i = 0; i < dots.length; i += 9) {
    groups.push(dots.slice(i, i + 9));
  }
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

      {/* The arc, centred under the top row. */}
      <Box contentAlignment="topCenter" modifiers={[fillMaxWidth(), padding(0, 22, 0, 0)]}>
        <Box modifiers={[width(arcW), height(arcH)]}>
          {groups.map((group, g) => (
            <Box key={`g${String(g)}`} modifiers={[fillMaxSize()]}>
              {group.map(dot => {
                const c = point(dot.t);
                return (
                  <Box key={dot.key} modifiers={[padding(c.x - dot.d / 2, c.y - dot.d / 2, 0, 0)]}>
                    <Box
                      modifiers={[
                        size(dot.d, dot.d),
                        cornerRadius(dot.d / 2),
                        background(dot.color),
                      ]}
                    />
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>

      {/* The ticking countdown inside the arc, and what it's counting down to. */}
      <Column horizontalAlignment="center" modifiers={[fillMaxWidth(), padding(0, 50, 0, 0)]}>
        <Countdown
          at={p.at}
          color={white}
          fontSize={32}
          align="center"
          modifiers={[fillMaxWidth()]}
        />
        <Text color={soft} maxLines={1} style={{fontSize: 13}}>
          {p.untilLabel}
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
