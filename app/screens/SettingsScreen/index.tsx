import React from 'react';
import {ScrollView} from 'react-native-gesture-handler';
import {Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {keys, pick} from 'lodash/fp';
import Body from '../../components/Body';
import I18n from '../../I18n';
import Title from '../../components/Title';
import useAppSettings from '../../hooks/useAppSettings';
import styles from './styles';
import useColorScheme from '../../hooks/useColorScheme';
import Colors from '../../theme/Colors';

const settingSanitizer = pick([
  'location',
  'asr',
  'fajrIshaCalculation',
  'calculationMethod',
  'sound',
]);

const settingsHash: SettingScreenHash = {
  location: {
    screen: 'Location',
    name: 'Location',
  },
};

const SettingsTile: React.FunctionComponent<SettingsTitleInterface> = ({
  label,
  clickable,
}) => {
  const navigation = useNavigation();
  const {isDarkMode} = useColorScheme();
  const textColor = {
    color: isDarkMode ? Colors.light : Colors.dark,
  };
  const labelC = (
    <Text style={[styles.tileLabel, textColor]}>
      {I18n.t(`settings.${label}`)}
    </Text>
  );
  return (
    <>
      {clickable ? (
        <TouchableOpacity
          style={styles.tile}
          onPress={() =>
            // @ts-ignore
            navigation.navigate(settingsHash[label].screen, {
              name: settingsHash[label].name,
            })
          }>
          {labelC}
        </TouchableOpacity>
      ) : (
        <View style={styles.tile}>{labelC}</View>
      )}
    </>
  );
};

const SettingsScreen = () => {
  const {settings} = useAppSettings();
  return (
    <Body>
      <Title>{I18n.t('settings.title')}</Title>
      <ScrollView>
        {keys(settingSanitizer(settings)).map(label => (
          <SettingsTile
            clickable={Boolean(settingsHash[label])}
            key={`setting-${label}`}
            label={label}
          />
        ))}
      </ScrollView>
    </Body>
  );
};
export default SettingsScreen;
