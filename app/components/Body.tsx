import React from 'react';
import {useColorScheme, View} from 'react-native';
import Colors from '../theme/Colors';

const Body: React.FC = ({children}) => {
  const isDarkMode = useColorScheme() === 'dark';
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
