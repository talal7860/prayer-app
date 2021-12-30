import React from 'react';
import {Text} from 'react-native';
import styles from './styles';
import useTheme from '../../hooks/useTheme';

const Title = ({...rest}) => {
  const theme = useTheme();

  return <Text {...rest} style={[styles.title, theme.styles.bodyText]} />;
};
export default Title;
