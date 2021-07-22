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
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

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

const App = () => (
  <NavigationContainer>
    <AppSettingsProvider>
      <Tab.Navigator
        lazy
        screenOptions={({route}) => ({
          tabBarIcon: ({focused, color, size}) => (
            <Ionicons
              name={tabIconNames[route.name][`${focused}`]}
              size={size}
              color={color}
            />
          ),
        })}
        initialRouteName="Prayer Times"
        tabBarOptions={{
          activeTintColor: 'black',
          inactiveTintColor: 'gray',
        }}>
        <Tab.Screen name="Prayer Times" component={HomeScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </AppSettingsProvider>
  </NavigationContainer>
);

export default App;
