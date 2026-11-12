import {
  KAABA,
  formatKm,
  headingOf,
  isFacing,
  needsCalibration,
  normalize,
  qiblaBearing,
  qiblaDistanceKm,
  qiblaOffset,
  signed,
  unwrap,
} from '../app/lib/qibla';

describe('bearing', () => {
  // Great-circle qibla directions (true north), to within half a degree.
  it.each([
    ['Calgary', {lat: 51.05, lng: -114.07}, 25],
    ['New York', {lat: 40.7128, lng: -74.006}, 58.5],
    ['London', {lat: 51.5074, lng: -0.1278}, 119],
    ['Karachi', {lat: 24.8607, lng: 67.0011}, 267.5],
    ['Jakarta', {lat: -6.2088, lng: 106.8456}, 295.2],
    ['Sydney', {lat: -33.8688, lng: 151.2093}, 277.5],
  ])('%s', (_, location, expected) => {
    expect(Math.abs(signed(qiblaBearing(location) - expected))).toBeLessThan(0.6);
  });

  it('is always 0–360', () => {
    for (const lng of [-179, -90, 0, 39, 40, 90, 179]) {
      const b = qiblaBearing({lat: 10, lng});
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(360);
    }
  });
});

describe('distance', () => {
  it('Calgary to Makkah is about 11,560 km', () => {
    expect(qiblaDistanceKm({lat: 51.05, lng: -114.07})).toBeCloseTo(11_560, -2);
  });

  it('is 0 at the Kaaba', () => {
    expect(qiblaDistanceKm(KAABA)).toBeCloseTo(0, 5);
  });

  it('formats whole kilometres with separators', () => {
    expect(formatKm(11_789.6)).toBe('11,790');
    expect(formatKm(845.2)).toBe('845');
    expect(formatKm(0.3)).toBe('0');
  });
});

describe('heading', () => {
  it('uses true north when it has it', () => {
    expect(headingOf({trueHeading: 12, magHeading: 25})).toBe(12);
  });

  it('falls back to magnetic north when true north is −1', () => {
    expect(headingOf({trueHeading: -1, magHeading: 25})).toBe(25);
  });

  it('is null with no reading at all', () => {
    expect(headingOf({trueHeading: -1, magHeading: -1})).toBeNull();
    expect(headingOf({trueHeading: NaN, magHeading: NaN})).toBeNull();
  });

  it('wraps 360 to 0', () => {
    expect(headingOf({trueHeading: 360, magHeading: 0})).toBe(0);
  });

  it('low and no accuracy ask for calibration', () => {
    expect(needsCalibration(0)).toBe(true);
    expect(needsCalibration(1)).toBe(true);
    expect(needsCalibration(2)).toBe(false);
    expect(needsCalibration(3)).toBe(false);
    expect(needsCalibration(null)).toBe(false);
  });
});

describe('offset and facing', () => {
  it('is relative to the top of the phone, the short way round', () => {
    expect(qiblaOffset(18, 0)).toBe(18);
    expect(qiblaOffset(18, 30)).toBe(-12);
    expect(qiblaOffset(5, 355)).toBe(10);
    expect(qiblaOffset(355, 5)).toBe(-10);
    expect(qiblaOffset(90, 270)).toBe(180);
  });

  it('starts facing at ±5° and stops past ±8°', () => {
    expect(isFacing(4.9)).toBe(true);
    expect(isFacing(-5)).toBe(true);
    expect(isFacing(6)).toBe(false);
    expect(isFacing(6, true)).toBe(true);
    expect(isFacing(-7.9, true)).toBe(true);
    expect(isFacing(8.5, true)).toBe(false);
  });
});

describe('angles', () => {
  it('normalize and signed wrap', () => {
    expect(normalize(-10)).toBe(350);
    expect(normalize(725)).toBe(5);
    expect(signed(190)).toBe(-170);
    expect(signed(-190)).toBe(170);
    expect(signed(180)).toBe(180);
  });

  it('unwrap keeps the animation from spinning across north', () => {
    expect(unwrap(359, 1)).toBe(361);
    expect(unwrap(361, 359)).toBe(359);
    expect(unwrap(-2, 358)).toBe(-2);
    expect(unwrap(10, 20)).toBe(20);
    expect(unwrap(720, 5)).toBe(725);
  });
});
