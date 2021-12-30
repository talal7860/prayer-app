import {map} from 'lodash/fp';
import React from 'react';
import {ScrollView, TouchableOpacity, Text} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useColorScheme from '../../hooks/useColorScheme';
import Colors from '../../theme/Colors';
import useTheme from '../../hooks/useTheme';

import styles from './styles';

const SelectList: React.FunctionComponent<SelectListInterface> = ({
  items,
  selected,
  onSelect,
}) => {
  const theme = useTheme();
  const {isDarkMode} = useColorScheme();
  const iconColor = isDarkMode ? Colors.selectedDark : Colors.selectedLight;
  return (
    <ScrollView>
      {map(item => (
        <TouchableOpacity
          key={`sl-${item}`}
          style={styles.item}
          onPress={() => onSelect(item)}>
          <Text style={[styles.text, theme.styles.bodyText]}>
            {/* @ts-ignore*/}
            {item}
          </Text>
          {selected === item ? (
            <Ionicons
              style={styles.selected}
              name="checkmark"
              color={iconColor}
              size={25}
            />
          ) : null}
        </TouchableOpacity>
      ))(items)}
    </ScrollView>
  );
};

export default SelectList;
