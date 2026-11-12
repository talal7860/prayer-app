import {HStack, Spacer, Text, VStack} from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  opacity,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import {createWidget, type WidgetEnvironment} from 'expo-widgets';
import type {NextPrayerProps} from './types';

// Runs in the widget extension's own JS runtime: no hooks, no imports at runtime and no
// module-level values. Everything it shows comes in through props.
const NextPrayer = (props: NextPrayerProps, env: WidgetEnvironment) => {
  'widget';
  const at = new Date(props.at);
  const family = env.widgetFamily;
  const sky = {
    type: 'linearGradient' as const,
    colors: ['#2E63C9', '#163A85'],
    startPoint: {x: 0, y: 0},
    endPoint: {x: 1, y: 1},
  };

  if (family === 'accessoryInline') {
    return (
      <Text modifiers={[containerBackground('clear', 'widget')]}>
        {props.next} {props.time}
      </Text>
    );
  }
  if (family === 'accessoryCircular') {
    return (
      <VStack spacing={0} modifiers={[containerBackground('clear', 'widget')]}>
        <Text modifiers={[font({size: 11, weight: 'semibold'}), lineLimit(1), minimumScaleFactor(0.6)]}>
          {props.next}
        </Text>
        <Text
          date={at}
          dateStyle="timer"
          modifiers={[font({size: 13, weight: 'bold'}), monospacedDigit(), minimumScaleFactor(0.5), lineLimit(1)]}
        />
      </VStack>
    );
  }
  if (family === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[containerBackground('clear', 'widget')]}>
        <Text modifiers={[font({size: 15, weight: 'bold'})]}>
          {props.next} · {props.time}
        </Text>
        <Text date={at} dateStyle="timer" modifiers={[font({size: 15}), monospacedDigit()]} />
        <Text modifiers={[font({size: 12}), opacity(0.7), lineLimit(1)]}>{props.city}</Text>
      </VStack>
    );
  }

  const summary = (
    <VStack alignment="leading" spacing={2}>
      <Text modifiers={[font({size: 12, weight: 'medium'}), opacity(0.8), lineLimit(1)]}>
        {props.city}
      </Text>
      <Spacer />
      <Text modifiers={[font({size: 12, weight: 'medium'}), opacity(0.8)]}>{props.heading}</Text>
      <Text modifiers={[font({size: 26, weight: 'bold'}), lineLimit(1), minimumScaleFactor(0.6)]}>
        {props.next}
      </Text>
      <Text modifiers={[font({size: 14, weight: 'semibold'})]}>{props.time}</Text>
      <Text
        date={at}
        dateStyle="timer"
        modifiers={[font({size: 13}), monospacedDigit(), opacity(0.8)]}
      />
    </VStack>
  );

  if (family === 'systemMedium') {
    return (
      <HStack
        spacing={16}
        modifiers={[containerBackground(sky, 'widget'), foregroundStyle('#FFFFFF')]}>
        {summary}
        <VStack spacing={3} modifiers={[frame({maxWidth: 10000})]}>
          {props.prayers.map(p => (
            <HStack key={p.name} modifiers={[opacity(p.current || p.next ? 1 : 0.75)]}>
              <Text modifiers={[font({size: 13, weight: p.next ? 'bold' : 'regular'})]}>{p.name}</Text>
              <Spacer />
              <Text modifiers={[font({size: 13, weight: p.next ? 'bold' : 'regular'}), monospacedDigit()]}>
                {p.time}
              </Text>
            </HStack>
          ))}
        </VStack>
      </HStack>
    );
  }

  return (
    <HStack modifiers={[containerBackground(sky, 'widget'), foregroundStyle('#FFFFFF'), padding({all: 0})]}>
      {summary}
      <Spacer />
    </HStack>
  );
};

export default createWidget('NextPrayer', NextPrayer);
