import {act, renderHook} from '@testing-library/react-native';
import {AppState, Platform} from 'react-native';
import useExactAlarms from '../app/hooks/useExactAlarms';

let mockAllowed = false;
const mockOpenSettings = jest.fn(() => true);
jest.mock('../modules/exact-alarm', () => ({
  canScheduleExactAlarms: () => mockAllowed,
  openExactAlarmSettings: () => mockOpenSettings(),
}));

let onChange: (state: string) => void = () => undefined;
beforeEach(() => {
  mockAllowed = false;
  mockOpenSettings.mockClear();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
    onChange = handler as (state: string) => void;
    return {remove: jest.fn()};
  });
});

it('asks on Android until exact alarms are allowed, re-checking on return to the app', async () => {
  Platform.OS = 'android';
  const {result} = await renderHook(() => useExactAlarms());
  expect(result.current.needed).toBe(true);

  await act(() => {
    result.current.allow();
  });
  expect(mockOpenSettings).toHaveBeenCalledTimes(1);

  // The user turns on "Alarms & reminders" and comes back.
  mockAllowed = true;
  await act(() => {
    onChange('active');
  });
  expect(result.current.needed).toBe(false);
});

it('never asks on iOS', async () => {
  Platform.OS = 'ios';
  const {result} = await renderHook(() => useExactAlarms());
  expect(result.current.needed).toBe(false);
});
