import AsyncStorage from '@react-native-async-storage/async-storage';
import CalculationMethod from '../constants/calculation-method';

const baseKey = '@prayer_app:';

const storageKeys: Record<string, string> = Object.freeze({
  location: 'location',
  prayerAdjustments: 'prayerAdjustments',
  asrJuristics: 'asrJuristics',
  calculationMethod: 'calculationMethod',
});

const defaultValues: Record<string, any> = Object.freeze({
  location: {
    // default is calgary
    lat: 51.05011,
    lng: -114.08529,
  },
  calculationMethod: 'Karachi',
  prayerAdjustments: {
    isha: '90 min',
    fajrFromSunrise: '-90 min',
  },
});

const storeData = (key: string, value: any) => {
  try {
    const jsonValue = JSON.stringify(value);
    return AsyncStorage.setItem(`${baseKey}${key}`, jsonValue);
  } catch (error) {
    console.error(error.message);
  }
};

const getData = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(`${baseKey}${key}`);
    return value != null ? JSON.parse(value) : null;
  } catch (e) {
    console.error(e.message);
  }
};

const location = async (): Promise<Location> => {
  const data = await getData(storageKeys.location);
  return data || defaultValues.location;
};

const setLocation = (data: Location) => storeData(storageKeys.location, data);

const calculationMethod = async (): Promise<CalculationMethod> => {
  const data = await getData(storageKeys.calculationMethods);
  return data || defaultValues.calculationMethods;
};

const setCalculationMethod = (data: CalculationMethod) =>
  storeData(storageKeys.calculationMethod, data);

const adjustments = async (): Promise<Adjustment> => {
  const data = await getData(storageKeys.prayerAdjustments);
  return data || defaultValues.prayerAdjustments;
};

const setAdjustments = (data: Adjustment) =>
  storeData(storageKeys.prayerAdjustments, data);

export default {
  location,
  setLocation,
  calculationMethod,
  setCalculationMethod,
  adjustments,
  setAdjustments,
};
