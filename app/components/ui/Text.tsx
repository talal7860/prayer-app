import React from 'react';
import {Text as RNText, type TextProps, type TextStyle} from 'react-native';
import useA11yPrefs from '../../hooks/useA11yPrefs';
import {fonts} from '../../theme/tokens';

type Weight = keyof typeof fonts;

type Props = TextProps & {
  weight?: Weight;
  size?: number;
  color?: string;
  style?: TextStyle | TextStyle[];
  ref?: React.Ref<React.ComponentRef<typeof RNText>>;
};

/** With Bold Text on, every weight moves one step up (iOS can't embolden a custom font itself). */
const BOLDER: Record<Weight, Weight> = {
  light: 'regular',
  regular: 'semibold',
  medium: 'semibold',
  semibold: 'bold',
  bold: 'bold',
};

/** Inter text. Custom fonts need the weight in the family name, not fontWeight. */
const Text = ({weight = 'regular', size = 15, color, style, ...rest}: Props) => {
  const {boldText} = useA11yPrefs();
  return (
    <RNText
      {...rest}
      style={[
        {fontFamily: fonts[boldText ? BOLDER[weight] : weight], fontSize: size, color},
        ...(Array.isArray(style) ? style : [style]),
      ]}
    />
  );
};

export default Text;
