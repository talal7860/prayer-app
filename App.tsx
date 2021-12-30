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
import {NativeBaseProvider} from 'native-base';
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
import AsrMethodScreen from './app/screens/SettingsScreen/Asr';
import I18n from './app/I18n';
import useColorScheme from './app/hooks/useColorScheme';
import Colors from './app/theme/Colors';

const Tab = createBottomTabNavigator();

const tabIconNames: Record<string, any> = {
  home: {
    true: 'time-outline',
    false: 'time',
  },
  settings: {
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
        headerTitle: I18n.t(`${route.name}.title`),
        tabBarActiveTintColor: isDarkMode ? Colors.light : Colors.dark,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
      initialRouteName="home">
      <Tab.Screen
        name="home"
        component={HomeScreen}
        options={{
          title: I18n.t('home.title'),
          tabBarLabel: I18n.t('home.title'),
        }}
      />
      <Tab.Screen
        name="settings"
        component={SettingsScreen}
        options={{title: I18n.t('settings.title')}}
      />
    </Tab.Navigator>
  );
};

const App = () => {
  const {isDarkMode} = useColorScheme();
  return (
    <NativeBaseProvider>
      <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
        <AppSettingsProvider>
          <Stack.Navigator>
            <Stack.Screen name="home-tabs" component={HomeTabs} />
            <Stack.Screen
              name="location"
              component={LocationSettingScreen}
              options={{title: I18n.t('locations.title')}}
            />
            <Stack.Screen
              name="asr"
              component={AsrMethodScreen}
              options={{title: I18n.t('asr.title')}}
            />
          </Stack.Navigator>
        </AppSettingsProvider>
      </NavigationContainer>
    </NativeBaseProvider>
  );
};

export default App;
