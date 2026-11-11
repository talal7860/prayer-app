import React from 'react';
import {StatusBar, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Colors from '../theme/Colors';
import useColorScheme from '../hooks/useColorScheme';

const Body: React.FC<React.PropsWithChildren> = ({children}) => {
  const {isDarkMode} = useColorScheme();

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  return (
    // The navigator header and tab bar already handle the top and bottom insets.
    <SafeAreaView edges={['left', 'right']} style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View
        style={{
          backgroundColor: isDarkMode ? Colors.black : Colors.white,
        }}
      >
        {children}
      </View>
    </SafeAreaView>
  );
};

export default Body;
