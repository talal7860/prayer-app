import React from 'react';
import Svg, {Circle, Path, Rect} from 'react-native-svg';

// Stroke icons from the redesign canvas (24x24 grid).
const paths = {
  fajr: 'M3 18h18M6 21h12M17 14a5 5 0 0 0-10 0M12 3v3M4.2 8.2l1.4 1.4M19.8 8.2l-1.4 1.4',
  sunrise: 'M3 18h18M7 18a5 5 0 0 1 10 0M12 10V4M9.5 6.5 12 4l2.5 2.5',
  dhuhr:
    'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  asr: 'M10 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6M10 4v2M10 18v2M3 12h2M15 12h2M5 7l1.4 1.4M3 20h18',
  maghrib: 'M3 18h18M7 18a5 5 0 0 1 10 0M12 4v6M9.5 7.5 12 10l2.5-2.5',
  isha: 'M20 13.5A8 8 0 1 1 10.5 4a6.3 6.3 0 0 0 9.5 9.5z',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
  bellOff:
    'M8.7 3.7A6 6 0 0 1 18 8c0 2.6.4 4.6 1 6M17 17H3s3-2 3-9c0-.6.1-1.2.2-1.7M10.3 21a1.94 1.94 0 0 0 3.4 0M2 2l20 20',
  pin: 'M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z',
  chevron: 'M9 6l6 6-6 6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  navigate: 'M3 11l18-8-8 18-2-8-8-2z',
  back: 'M15 6l-6 6 6 6',
} as const;

export type IconName =
  | keyof typeof paths
  | 'sliders'
  | 'clock'
  | 'calendar';

type Props = {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
};

const Icon = ({name, size = 20, color, strokeWidth = 1.8}: Props) => {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {name === 'sliders' ? (
        <>
          <Path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" {...common} />
          <Circle cx={16} cy={6} r={2} {...common} />
          <Circle cx={10} cy={12} r={2} {...common} />
          <Circle cx={18} cy={18} r={2} {...common} />
        </>
      ) : name === 'clock' ? (
        <>
          <Circle cx={12} cy={12} r={9} {...common} />
          <Path d="M12 7v5l3 2" {...common} />
        </>
      ) : name === 'calendar' ? (
        <>
          <Rect x={3.5} y={5} width={17} height={15} rx={3} {...common} />
          <Path d="M3.5 10h17M8 3v4M16 3v4" {...common} />
        </>
      ) : name === 'pin' ? (
        <>
          <Path d={paths.pin} {...common} />
          <Circle cx={12} cy={9.5} r={2.5} {...common} />
        </>
      ) : (
        <Path d={paths[name]} {...common} />
      )}
    </Svg>
  );
};

export default Icon;
