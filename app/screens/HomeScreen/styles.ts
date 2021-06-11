import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  title: {
    display: 'flex',
    alignContent: 'center',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  timeContainer: {
    display: 'flex',
    marginTop: 25,
    flexDirection: 'row',
    alignContent: 'center',
  },
  labelTime: {
    display: 'flex',
  },
  times: {
    marginStart: 30,
    marginEnd: 30,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  content: {
    fontSize: 20,
    paddingTop: 13,
    paddingBottom: 13,
  },
  time: {
    marginStart: 'auto',
  },
  nextPrayer: {
    textAlign: 'center',
    marginTop: 10,
    width: '100%',
  },
  infoContainer: {
    marginTop: 15,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
});
