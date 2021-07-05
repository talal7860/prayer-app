import React from 'react';
import {View} from 'react-native';
import Colors from '../theme/Colors';
import useColorScheme from '../hooks/useColorScheme';

const Body: React.FC = ({children}) => {
  const {isDarkMode} = useColorScheme();
  return (
    <View
      style={{
        backgroundColor: isDarkMode ? Colors.black : Colors.white,
      }}>
      {children}
    </View>
  );
};

export default Body;
