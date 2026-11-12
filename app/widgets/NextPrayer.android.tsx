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
// go: they can't tick, draw gradients or rings, so it's the period's sky colour, the next
// prayer and the day's times. The app refreshes it on open, while open and from the
// background task. Runs in the widget's own JS runtime: no hooks, imports or module values.
//
// Android widgets are Glance (RemoteViews) underneath, and expo-widgets maps only part of
// Compose: no `weight`, no spaceBetween/spaceEvenly, and the layout isn't told the widget's
// size. So things are placed with Box layers (city start / Hijri date end, chips at the
// bottom) and the chips have a fixed width, centred as a group.
const NextPrayer = (p: NextPrayerProps) => {
  'widget';
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

      {/* The next prayer, under the top row. */}
      <Column modifiers={[padding(0, 24, 0, 0)]}>
        <Text color={white} maxLines={1} style={{fontSize: 30, fontWeight: 'bold'}}>
          {p.next}
        </Text>
        <Text color={soft} maxLines={1} style={{fontSize: 15}}>
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
