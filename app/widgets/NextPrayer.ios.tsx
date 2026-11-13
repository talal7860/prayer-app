import {Circle, HStack, Image, ProgressView, Spacer, Text, VStack, ZStack} from '@expo/ui/swift-ui';
import {
  accessibilityElement,
  accessibilityHidden,
  accessibilityLabel,
  background,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  multilineTextAlignment,
  offset,
  opacity,
  padding,
  progressViewStyle,
  shapes,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import {createWidget, type WidgetEnvironment} from 'expo-widgets';
import type {NextPrayerProps} from './types';

// The "Widgets & lock screen" board of the design canvas (#34).
// Runs in the widget extension's own JS runtime: no hooks, no imports at runtime and no
// module-level values. Everything it shows comes in through props, already formatted.
const NextPrayer = (p: NextPrayerProps, env: WidgetEnvironment) => {
  'widget';
  const at = new Date(p.at);
  const range = {lower: new Date(p.prevAt), upper: at};
  const family = env.widgetFamily;
  const white = '#FFFFFF';
  const gold = '#FFE7A3';
  const soft = 'rgba(255,255,255,0.88)';
  const sky = {
    type: 'linearGradient' as const,
    colors: p.sky,
    startPoint: {x: 0, y: 0},
    endPoint: {x: 1, y: 1},
  };

  // A dotted half-ellipse from Fajr (left) to Isha (right), the prayers on it, and the sun.
  // There's no path drawing here, so every dot is a small circle placed along the curve.
  const arc = (w: number, h: number, dots: number, withMarks: boolean) => {
    const point = (t: number) => {
      const a = Math.PI * (1 - t);
      return {x: w / 2 + (w / 2 - 6) * Math.cos(a), y: h - 4 - (h - 10) * Math.sin(a)};
    };
    const dot = (key: string, t: number, size: number, color: string, alpha: number) => {
      const c = point(t);
      return (
        <Circle
          key={key}
          modifiers={[
            foregroundStyle(color),
            opacity(alpha),
            frame({width: size, height: size}),
            offset({x: c.x - size / 2, y: c.y - size / 2}),
          ]}
        />
      );
    };
    const items = [];
    for (let i = 0; i <= dots; i++) {
      items.push(dot(`d${i}`, i / dots, 2.5, white, 0.45));
    }
    if (withMarks) {
      p.marks.forEach((m, i) =>
        items.push(dot(`m${i}`, m.t, m.next ? 11 : 7, white, m.next ? 1 : m.past ? 0.45 : 0.9)),
      );
    }
    if (p.sunT >= 0) {
      items.push(dot('glow', p.sunT, 18, gold, 0.3));
      items.push(dot('sun', p.sunT, 10, gold, 1));
    }
    return (
      // Dozens of dots: hidden from VoiceOver, which gets the times as text.
      <ZStack
        alignment="topLeading"
        modifiers={[
          frame({width: w, height: h, alignment: 'topLeading'}),
          accessibilityHidden(true),
        ]}>
        {items}
      </ZStack>
    );
  };

  // "Asr, 3:42 PM, Next": a chip or row read as one, with the full name and AM/PM.
  const rowA11y = (r: {name: string; time: string; now: boolean; next: boolean}) => [
    accessibilityElement('combine'),
    accessibilityLabel(
      r.next
        ? `${r.name}, ${r.time}, ${p.nextTag}`
        : r.now
          ? `${r.name}, ${r.time}, ${p.nowTag}`
          : `${r.name}, ${r.time}`,
    ),
  ];

  // A timer Text takes the full width, so it's aligned explicitly.
  const countdown = (size: number, centered = false) => (
    <Text
      date={at}
      dateStyle="timer"
      modifiers={[
        font({size, weight: 'semibold'}),
        monospacedDigit(),
        lineLimit(1),
        minimumScaleFactor(0.5),
        multilineTextAlignment(centered ? 'center' : 'leading'),
      ]}
    />
  );

  if (family === 'accessoryInline') {
    return (
      <HStack modifiers={[containerBackground('clear', 'widget')]}>
        {/* Read as "Asr in", then the timer, instead of "moon stars". */}
        <Image systemName="moon.stars.fill" modifiers={[accessibilityLabel(p.inLabel)]} />
        <Text date={at} dateStyle="timer" />
      </HStack>
    );
  }

  if (family === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={3} modifiers={[containerBackground('clear', 'widget')]}>
        <Text modifiers={[font({size: 12, weight: 'semibold'}), opacity(0.88), lineLimit(1)]}>
          {p.next} · {p.time}
        </Text>
        {countdown(22)}
        <ProgressView
          timerInterval={range}
          countsDown={false}
          modifiers={[progressViewStyle('linear'), tint(white), accessibilityLabel(p.untilLabel)]}>
          <Text> </Text>
        </ProgressView>
      </VStack>
    );
  }

  if (family === 'systemMedium') {
    return (
      <VStack spacing={0} modifiers={[containerBackground(sky, 'widget'), foregroundStyle(white)]}>
        <ZStack alignment="top" modifiers={[frame({height: 108})]}>
          {arc(300, 86, 34, true)}
          <HStack modifiers={[padding({horizontal: 4})]}>
            <Text modifiers={[font({size: 11}), foregroundStyle(soft)]}>{p.city}</Text>
            <Spacer />
            <Text modifiers={[font({size: 11}), foregroundStyle(soft), lineLimit(1)]}>
              {p.hijriShort}
            </Text>
          </HStack>
          <VStack spacing={2} modifiers={[padding({top: 46}), accessibilityElement('combine')]}>
            {countdown(30, true)}
            <Text modifiers={[font({size: 12}), foregroundStyle(soft), lineLimit(1)]}>
              {p.untilLabel}
            </Text>
          </VStack>
        </ZStack>
        <HStack
          spacing={2}
          modifiers={[
            padding({all: 5}),
            background('rgba(0,0,0,0.24)', shapes.roundedRectangle({cornerRadius: 12})),
          ]}>
          {p.prayers.map(r => (
            <VStack
              key={r.label}
              spacing={1}
              modifiers={[
                frame({height: 36}),
                frame({maxWidth: 1000}),
                // Filled = it's that prayer's time now, as on Today; the next one is gold.
                background(
                  r.now ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0)',
                  shapes.roundedRectangle({cornerRadius: 10}),
                ),
                ...rowA11y(r),
              ]}>
              <Text
                modifiers={[
                  font({size: 10, weight: 'semibold'}),
                  foregroundStyle(r.next ? gold : 'rgba(255,255,255,0.82)'),
                  lineLimit(1),
                  minimumScaleFactor(0.7),
                ]}>
                {r.label.toUpperCase()}
              </Text>
              <Text
                modifiers={[
                  font({size: 13, weight: r.next ? 'bold' : 'medium'}),
                  monospacedDigit(),
                  opacity(r.past ? 0.74 : 1),
                ]}>
                {r.hm}
              </Text>
            </VStack>
          ))}
        </HStack>
      </VStack>
    );
  }

  if (family === 'systemLarge') {
    return (
      <VStack
        spacing={8}
        modifiers={[containerBackground('#141A2C', 'widget'), foregroundStyle(white)]}>
        <ZStack
          alignment="top"
          modifiers={[
            frame({height: 162}),
            frame({maxWidth: 1000}),
            padding({horizontal: 2}),
            background(sky, shapes.roundedRectangle({cornerRadius: 18})),
          ]}>
          <VStack modifiers={[padding({top: 30})]}>{arc(290, 110, 40, true)}</VStack>
          <HStack modifiers={[padding({horizontal: 14, top: 10})]}>
            <Text modifiers={[font({size: 12}), foregroundStyle(soft)]}>{p.cityFull}</Text>
            <Spacer />
            <Text modifiers={[font({size: 12}), foregroundStyle(soft), lineLimit(1)]}>
              {p.hijri}
            </Text>
          </HStack>
          <VStack spacing={3} modifiers={[padding({top: 62}), accessibilityElement('combine')]}>
            <Text modifiers={[font({size: 13, weight: 'semibold'}), foregroundStyle(soft)]}>
              {p.inLabel}
            </Text>
            {countdown(42, true)}
            <Text modifiers={[font({size: 12}), foregroundStyle(soft)]}>{p.atLabel}</Text>
          </VStack>
        </ZStack>
        <VStack spacing={4}>
          {p.prayers.map(r => (
            <HStack
              key={r.name}
              spacing={10}
              modifiers={[
                padding({horizontal: 10}),
                frame({height: 30}),
                background(
                  r.now ? '#1E2848' : 'rgba(0,0,0,0)',
                  shapes.roundedRectangle({cornerRadius: 9}),
                ),
                ...rowA11y(r),
              ]}>
              <Circle
                modifiers={[
                  foregroundStyle(r.next ? gold : r.past ? '#3A4262' : '#8FA2D9'),
                  frame({width: 7, height: 7}),
                ]}
              />
              <Text
                modifiers={[
                  font({size: 14, weight: r.next ? 'bold' : 'medium'}),
                  foregroundStyle(r.next ? white : r.past ? '#8C93AA' : '#D5D9E6'),
                ]}>
                {r.name}
              </Text>
              {r.next || r.now ? (
                <Text
                  modifiers={[
                    font({size: 10, weight: 'bold'}),
                    foregroundStyle(r.next ? gold : soft),
                  ]}>
                  {(r.next ? p.nextTag : p.nowTag).toUpperCase()}
                </Text>
              ) : null}
              <Spacer />
              <Text
                modifiers={[
                  font({size: 14, weight: r.next ? 'bold' : 'medium'}),
                  monospacedDigit(),
                  foregroundStyle(r.next ? white : r.past ? '#8C93AA' : '#D5D9E6'),
                ]}>
                {r.time}
              </Text>
            </HStack>
          ))}
        </VStack>
      </VStack>
    );
  }

  // systemSmall: the "sky" small widget.
  return (
    <VStack
      alignment="leading"
      spacing={0}
      modifiers={[containerBackground(sky, 'widget'), foregroundStyle(white)]}>
      <Text
        modifiers={[
          font({size: 13, weight: 'semibold'}),
          foregroundStyle('rgba(255,255,255,0.9)'),
          lineLimit(1),
        ]}>
        {p.inLabel}
      </Text>
      <VStack modifiers={[padding({top: 6})]}>{countdown(32)}</VStack>
      <Text
        modifiers={[font({size: 13}), monospacedDigit(), foregroundStyle(soft), padding({top: 6})]}>
        {p.atLabel}
      </Text>
      <Spacer />
      {arc(124, 30, 18, false)}
    </VStack>
  );
};

export default createWidget('NextPrayer', NextPrayer);
