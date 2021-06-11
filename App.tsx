/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React from 'react';
import {SafeAreaView, StatusBar} from 'react-native';
import HomeScreen from './app/screens/HomeScreen';
import useColorScheme from './app/hooks/useColorScheme';

import Colors from './app/theme/Colors';
import {AppSettingsProvider} from './app/contexts/AppSettingsContext';

const App = () => {
  const {isDarkMode} = useColorScheme();

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppSettingsProvider>
        <HomeScreen />
      </AppSettingsProvider>
    </SafeAreaView>
  );
};

export default App;
