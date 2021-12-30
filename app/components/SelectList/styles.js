import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  item: {
    flex: 1,
    alignItems: 'center',
    display: 'flex',
    marginTop: 20,
    paddingBottom: 5,
    flexDirection: 'row',
    marginStart: 15,
    marginEnd: 15,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    minHeight: 40,
  },
  text: {
    fontSize: 15,
  },
  selected: {
    marginStart: 'auto',
  },
});
