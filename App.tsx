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
import HomeScreen from './app/screens/HomeScreen';
import SettingsScreen from './app/screens/SettingsScreen';
import {AppSettingsProvider} from './app/contexts/AppSettingsContext';
import 'react-native-gesture-handler';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LocationSettingScreen from './app/screens/SettingsScreen/Location';
import I18n from './app/I18n';
import useColorScheme from './app/hooks/useColorScheme';
import Colors from './app/theme/Colors';

const Tab = createBottomTabNavigator();

const tabIconNames: Record<string, any> = {
  'Prayer Times': {
    true: 'time-outline',
    false: 'time',
  },
  Settings: {
    true: 'cog-outline',
    false: 'cog',
  },
};
const Stack = createNativeStackNavigator();

const HomeTabs = () => {
  const {isDarkMode} = useColorScheme();
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => (
          <Ionicons
            name={tabIconNames[route.name][`${focused}`]}
            size={size}
            color={color}
          />
        ),
        tabBarActiveTintColor: isDarkMode ? Colors.light : Colors.dark,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
      initialRouteName="Prayer Times">
      <Tab.Screen name="Prayer Times" component={HomeScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const App = () => {
  const {isDarkMode} = useColorScheme();
  return (
    <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
      <AppSettingsProvider>
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={HomeTabs}
            options={{title: I18n.t('home.title'), headerShown: false}}
          />
          <Stack.Screen
            name="Location"
            component={LocationSettingScreen}
            options={{title: I18n.t('locations.title')}}
          />
        </Stack.Navigator>
      </AppSettingsProvider>
    </NavigationContainer>
  );
};

export default App;
