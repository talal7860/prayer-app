import React from 'react';
import {Text} from 'react-native';
import Colors from '../../theme/Colors';
import styles from './styles';
import useColorScheme from '../../hooks/useColorScheme';

const Title = ({...rest}) => {
  const {isDarkMode} = useColorScheme();
  const textColor = {
    color: isDarkMode ? Colors.light : Colors.dark,
  };

  return <Text {...rest} style={[styles.title, textColor]} />;
};
export default Title;
