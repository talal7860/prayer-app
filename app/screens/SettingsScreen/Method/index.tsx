import React from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import ChoiceList from '../../../components/ui/ChoiceList';
import useAppSettings from '../../../hooks/useAppSettings';
import CalculationMethod from '../../../constants/calculation-method';
import PrayerTimes from '../../../lib/PrayTimes';

// @ts-ignore PrayTimes is untyped JS
const methods = new PrayerTimes('MWL').getDefaults();

const MethodScreen = () => {
  const {settings, setSetting} = useAppSettings();
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <ChoiceList
        options={Object.values(CalculationMethod).map(key => ({
          value: key,
          label: methods[key].name,
        }))}
        value={settings.calculationMethod}
        onChange={setSetting('calculationMethod')}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({scroll: {padding: 16}});

export default MethodScreen;
