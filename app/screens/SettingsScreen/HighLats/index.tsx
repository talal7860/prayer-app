import React from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import ChoiceList from '../../../components/ui/ChoiceList';
import Text from '../../../components/ui/Text';
import useAppSettings from '../../../hooks/useAppSettings';
import usePalette from '../../../hooks/usePalette';
import I18n from '../../../I18n';
import useReadableWidth from '../../../hooks/useReadableWidth';

const RULES: HighLatRule[] = ['NightMiddle', 'AngleBased', 'OneSeventh'];

export const highLatOptions = () =>
  RULES.map(value => ({
    value,
    label: I18n.t(`highLats.${value}`),
    detail: I18n.t(`highLats.${value}Detail`),
  }));

const HighLatsScreen = () => {
  const column = useReadableWidth();
  const {settings, setSetting} = useAppSettings();
  const {t} = usePalette();
  return (
    <ScrollView contentContainerStyle={[styles.scroll, column]}>
      <Text size={13} color={t.muted} style={styles.hint}>
        {I18n.t('highLats.hint')}
      </Text>
      <ChoiceList
        options={highLatOptions()}
        value={settings.highLats}
        onChange={setSetting('highLats')}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {padding: 16, gap: 12},
  hint: {paddingHorizontal: 8, lineHeight: 19},
});

export default HighLatsScreen;
