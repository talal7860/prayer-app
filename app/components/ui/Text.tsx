import React from 'react';
import {Text as RNText, type TextProps, type TextStyle} from 'react-native';
import {fonts} from '../../theme/tokens';

type Weight = keyof typeof fonts;

type Props = TextProps & {
  weight?: Weight;
  size?: number;
  color?: string;
  style?: TextStyle | TextStyle[];
};

/** Inter text. Custom fonts need the weight in the family name, not fontWeight. */
const Text = ({weight = 'regular', size = 15, color, style, ...rest}: Props) => (
  <RNText
    {...rest}
    style={[
      {fontFamily: fonts[weight], fontSize: size, color},
      ...(Array.isArray(style) ? style : [style]),
    ]}
  />
);

export default Text;
