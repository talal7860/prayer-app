import {Column, Row, Spacer, Text} from '@expo/ui/jetpack-compose';
import {background, fillMaxSize, fillMaxWidth, paddingAll} from '@expo/ui/jetpack-compose/modifiers';
import {createWidget} from 'expo-widgets';
import type {NextPrayerProps} from './types';

// Runs in the widget's own JS runtime: no hooks, imports or module-level values at runtime.
// Android widgets don't tick, so this shows the time, not a countdown. The app refreshes it
// on open, at each prayer change while open, and from the background task.
const NextPrayer = (props: NextPrayerProps) => {
  'widget';
  return (
    <Row
      horizontalArrangement={{spacedBy: 16}}
      modifiers={[fillMaxSize(), background('#2453B3'), paddingAll(14)]}>
      <Column verticalArrangement={{spacedBy: 2}}>
        <Text color="#DCE6FF" maxLines={1} style={{fontSize: 12}}>
          {props.city}
        </Text>
        <Text color="#DCE6FF" style={{fontSize: 12}}>
          {props.heading}
        </Text>
        <Text color="#FFFFFF" maxLines={1} style={{fontSize: 24, fontWeight: 'bold'}}>
          {props.next}
        </Text>
        <Text color="#FFFFFF" style={{fontSize: 14, fontWeight: '600'}}>
          {props.time}
        </Text>
      </Column>
      <Column verticalArrangement={{spacedBy: 2}} modifiers={[fillMaxWidth()]}>
        {props.prayers.map(p => (
          <Row key={p.name} modifiers={[fillMaxWidth()]}>
            <Text color={p.next ? '#FFFFFF' : '#DCE6FF'} style={{fontSize: 13, fontWeight: p.next ? 'bold' : 'normal'}}>
              {p.name}
            </Text>
            <Spacer modifiers={[fillMaxWidth()]} />
            <Text color={p.next ? '#FFFFFF' : '#DCE6FF'} style={{fontSize: 13, fontWeight: p.next ? 'bold' : 'normal'}}>
              {p.time}
            </Text>
          </Row>
        ))}
      </Column>
    </Row>
  );
};

export default createWidget('NextPrayer', NextPrayer);
