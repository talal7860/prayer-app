import {Circle, HStack, Image, Spacer, Text, VStack} from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  font,
  foregroundStyle,
  frame,
  monospacedDigit,
  opacity,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import {createLiveActivity} from 'expo-widgets';
import type {PrayerActivityProps} from './types';

// Lock screen and Dynamic Island countdown for the hour before a prayer.
const PrayerActivity = (props: PrayerActivityProps) => {
  'widget';
  const at = new Date(props.at);
  const accent = '#FFE7A3';
  return {
    banner: (
      <HStack
        modifiers={[
          padding({all: 16}),
          activityBackgroundTint('#163A85'),
          foregroundStyle('#FFFFFF'),
        ]}>
        <VStack alignment="leading" spacing={2}>
          <Text modifiers={[font({size: 13, weight: 'medium'}), opacity(0.8)]}>{props.city}</Text>
          <Text modifiers={[font({size: 22, weight: 'bold'})]}>{props.next}</Text>
          <Text modifiers={[font({size: 14})]}>{props.time}</Text>
        </VStack>
        <Spacer />
        <VStack alignment="trailing" spacing={2}>
          <Text modifiers={[font({size: 13, weight: 'medium'}), opacity(0.8)]}>
            {props.inLabel}
          </Text>
          <Text
            date={at}
            dateStyle="timer"
            modifiers={[
              font({size: 30, weight: 'bold'}),
              monospacedDigit(),
              foregroundStyle(accent),
            ]}
          />
        </VStack>
      </HStack>
    ),
    // The board's black pill: a gold dot and the countdown.
    compactLeading: <Circle modifiers={[foregroundStyle(accent), frame({width: 8, height: 8})]} />,
    compactTrailing: (
      <Text date={at} dateStyle="timer" modifiers={[monospacedDigit(), foregroundStyle(accent)]} />
    ),
    minimal: <Image systemName="moon.stars.fill" color={accent} />,
    expandedLeading: (
      <VStack alignment="leading" spacing={2}>
        <Text modifiers={[font({size: 13}), opacity(0.8)]}>{props.inLabel}</Text>
        <Text modifiers={[font({size: 20, weight: 'bold'})]}>{props.next}</Text>
      </VStack>
    ),
    expandedTrailing: (
      <Text
        date={at}
        dateStyle="timer"
        modifiers={[font({size: 28, weight: 'bold'}), monospacedDigit(), foregroundStyle(accent)]}
      />
    ),
    expandedBottom: (
      <Text modifiers={[font({size: 13}), opacity(0.8)]}>
        {props.time} · {props.city}
      </Text>
    ),
  };
};

export default createLiveActivity('PrayerActivity', PrayerActivity);
