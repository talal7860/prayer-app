import AppConstants from '../app/AppConstants';

const at = (h: number, m: number) => new Date(2026, 10, 11, h, m);

describe('timeFormat', () => {
  it.each([
    [0, 5, '12:05 am'],
    [6, 16, '06:16 am'],
    [11, 59, '11:59 am'],
    [12, 20, '12:20 pm'],
    [13, 0, '01:00 pm'],
    [23, 41, '11:41 pm'],
  ])('formats %i:%i as %s', (h, m, expected) => {
    expect(AppConstants.timeFormat(at(h, m))).toBe(expected);
  });
});
