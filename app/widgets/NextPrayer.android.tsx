import {Column, Row, Spacer, Text} from '@expo/ui/jetpack-compose';
import {
  background,
  cornerRadius,
  fillMaxSize,
  fillMaxWidth,
  paddingAll,
} from '@expo/ui/jetpack-compose/modifiers';
import {createWidget} from 'expo-widgets';
import type {NextPrayerProps} from './types';

// The medium widget from the "Widgets & lock screen" board (#34), as far as Android widgets
// go: they can't tick, draw gradients or rings, so it's the period's sky colour, the next
// prayer and the day's times. The app refreshes it on open, while open and from the
// background task. Runs in the widget's own JS runtime: no hooks, imports or module values.
const NextPrayer = (p: NextPrayerProps) => {
  'widget';
  const soft = '#DCE6FF';
  return (
    <Column
      verticalArrangement={{spacedBy: 8}}
      modifiers={[fillMaxSize(), background(p.sky[0]), paddingAll(14)]}>
      <Row modifiers={[fillMaxWidth()]}>
        <Text color={soft} maxLines={1} style={{fontSize: 12}}>
          {p.city}
        </Text>
        <Spacer modifiers={[fillMaxWidth()]} />
        <Text color={soft} maxLines={1} style={{fontSize: 12}}>
          {p.hijriShort}
        </Text>
      </Row>
      <Column verticalArrangement={{spacedBy: 2}}>
        <Text color="#FFFFFF" maxLines={1} style={{fontSize: 22, fontWeight: 'bold'}}>
          {p.next}
        </Text>
        <Text color={soft} style={{fontSize: 13}}>
          {p.atLabel}
        </Text>
      </Column>
      <Row
        horizontalArrangement="spaceBetween"
        modifiers={[fillMaxWidth(), background('#33000000'), cornerRadius(12), paddingAll(6)]}>
        {p.prayers.map(r => (
          <Column key={r.label} horizontalAlignment="center">
            <Text color={r.next ? '#FFE7A3' : soft} maxLines={1} style={{fontSize: 10, fontWeight: '600'}}>
              {r.label.toUpperCase()}
            </Text>
            <Text color="#FFFFFF" maxLines={1} style={{fontSize: 13, fontWeight: r.next ? 'bold' : 'normal'}}>
              {r.hm}
            </Text>
          </Column>
        ))}
      </Row>
    </Column>
  );
};

export default createWidget('NextPrayer', NextPrayer);
