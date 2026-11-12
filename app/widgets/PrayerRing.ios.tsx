import {Circle, Text, VStack, ZStack} from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  multilineTextAlignment,
  rotationEffect,
  strokeBorder,
} from '@expo/ui/swift-ui/modifiers';
import {createWidget, type WidgetEnvironment} from 'expo-widgets';
import type {NextPrayerProps} from './types';

// The ring designs from the "Widgets & lock screen" board (#34): the dark small widget and
// the lock screen circle. The ring is how far we are from the last prayer to the next one,
// recalculated at every timeline entry (half-hourly and at each prayer).
// Runs in the widget's own JS runtime: no hooks, imports or module-level values.
const PrayerRing = (p: NextPrayerProps, env: WidgetEnvironment) => {
  'widget';
  const at = new Date(p.at);
  const now = env.date ? new Date(env.date).getTime() : Date.now();
  const frac = Math.min(1, Math.max(0, (now - p.prevAt) / (p.at - p.prevAt)));
  const lock = env.widgetFamily === 'accessoryCircular';
  const size = lock ? 56 : 116;
  const line = lock ? 4 : 8;
  // strokeBorder draws inside the frame, so the ring's radius is half the size minus half the line.
  const circumference = 2 * Math.PI * ((size - line) / 2);
  const track = lock ? 'rgba(255,255,255,0.25)' : '#2A3150';
  const fill = lock ? '#FFFFFF' : '#FFE7A3';

  const ring = (
    <ZStack modifiers={[frame({width: size, height: size})]}>
      <Circle
        modifiers={[
          foregroundStyle('rgba(0,0,0,0)'),
          strokeBorder({shape: 'circle', content: track, style: {lineWidth: line}}),
        ]}
      />
      <Circle
        modifiers={[
          // A Circle fills itself: make it clear, and stroke its outline (strokeBorder's
          // default shape is a rectangle).
          foregroundStyle('rgba(0,0,0,0)'),
          strokeBorder({
            shape: 'circle',
            content: fill,
            style: {
              lineWidth: line,
              lineCap: 'round',
              dash: [Math.max(0.01, frac * circumference), circumference],
            },
          }),
          rotationEffect(-90),
        ]}
      />
    </ZStack>
  );

  if (lock) {
    return (
      <ZStack modifiers={[containerBackground('clear', 'widget')]}>
        {ring}
        <VStack spacing={0}>
          <Text modifiers={[font({size: 9, weight: 'semibold'}), lineLimit(1)]}>{p.nextShort}</Text>
          <Text
            date={at}
            dateStyle="timer"
            modifiers={[
              font({size: 11, weight: 'bold'}),
              monospacedDigit(),
              lineLimit(1),
              minimumScaleFactor(0.5),
              multilineTextAlignment('center'),
              frame({width: 40}),
            ]}
          />
        </VStack>
      </ZStack>
    );
  }

  return (
    <ZStack modifiers={[containerBackground('#141A2C', 'widget'), foregroundStyle('#FFFFFF')]}>
      {ring}
      <VStack spacing={2}>
        <Text
          modifiers={[
            font({size: 12, weight: 'semibold'}),
            foregroundStyle('#A4ABC2'),
            lineLimit(1),
          ]}>
          {p.next}
        </Text>
        <Text
          date={at}
          dateStyle="timer"
          modifiers={[
            font({size: 20, weight: 'semibold'}),
            monospacedDigit(),
            lineLimit(1),
            minimumScaleFactor(0.6),
            multilineTextAlignment('center'),
            frame({width: 88}),
          ]}
        />
        <Text modifiers={[font({size: 11}), monospacedDigit(), foregroundStyle('#A4ABC2')]}>
          {p.time}
        </Text>
      </VStack>
    </ZStack>
  );
};

export default createWidget('PrayerRing', PrayerRing);
