// What's commonly used where, to preselect a sensible choice in the first-run setup.
// The user always picks; these are only starting points.

const METHOD_BY_COUNTRY: Record<string, PrayerCalculationMethod> = {
  US: 'ISNA',
  CA: 'ISNA',
  PK: 'Karachi',
  IN: 'Karachi',
  BD: 'Karachi',
  AF: 'Karachi',
  SA: 'Makkah',
  YE: 'Makkah',
  EG: 'Egypt',
  SY: 'Egypt',
  IQ: 'Egypt',
  LB: 'Egypt',
  IR: 'Tehran',
};

const HANAFI_COUNTRIES = ['PK', 'IN', 'BD', 'AF'];

/** Above this latitude twilight can last all night in summer, so the rule matters. */
export const HIGH_LATITUDE = 48;

export const recommendedMethod = (countryCode?: string): PrayerCalculationMethod =>
  (countryCode ? METHOD_BY_COUNTRY[countryCode.toUpperCase()] : undefined) ?? 'MWL';

export const recommendedAsr = (countryCode?: string): AsrJuristics =>
  countryCode && HANAFI_COUNTRIES.includes(countryCode.toUpperCase()) ? 'Hanafi' : 'Standard';

export const isHighLatitude = ({lat}: GeoLocation) => Math.abs(lat) >= HIGH_LATITUDE;
