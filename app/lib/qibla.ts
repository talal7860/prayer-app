import {Coordinates, Qibla} from 'adhan';
import {distanceKm} from './prayerDay';

/** The Kaaba, Makkah. */
export const KAABA: GeoLocation = {lat: 21.4225, lng: 39.8262};

/** Within this many degrees counts as facing the qibla. */
export const FACING_ENTER = 5;
/** Once facing, it takes this much to stop, so the state doesn't flicker at the edge. */
export const FACING_LEAVE = 8;

/** Wraps any angle into 0 ≤ a < 360. */
export const normalize = (deg: number) => ((deg % 360) + 360) % 360;

/** Wraps any angle into −180 < a ≤ 180. */
export const signed = (deg: number) => {
  const a = normalize(deg);
  return a > 180 ? a - 360 : a;
};

/** The qibla's direction from `location`, in degrees clockwise from true north. */
export const qiblaBearing = (location: GeoLocation) =>
  normalize(Qibla(new Coordinates(location.lat, location.lng)));

/** Great-circle distance to the Kaaba in km. */
export const qiblaDistanceKm = (location: GeoLocation) => distanceKm(location, KAABA);

type HeadingReading = {trueHeading: number; magHeading: number};

/**
 * Where the top of the phone points, in degrees from north. `trueHeading` is −1 when the
 * phone can't work out true north (no location fix yet); then magnetic north is the best there is.
 */
export const headingOf = ({trueHeading, magHeading}: HeadingReading): number | null => {
  const value = trueHeading >= 0 ? trueHeading : magHeading;
  return Number.isFinite(value) && value >= 0 ? normalize(value) : null;
};

/**
 * The qibla relative to the top of the phone: 0 is straight ahead, positive is to the right
 * (turn clockwise), negative to the left.
 */
export const qiblaOffset = (bearing: number, heading: number) => signed(bearing - heading);

/** Facing the qibla, with a little hysteresis: it starts at ±5° and stops past ±8°. */
export const isFacing = (offset: number, wasFacing = false) =>
  Math.abs(offset) <= (wasFacing ? FACING_LEAVE : FACING_ENTER);

/**
 * The next angle for an animated rotation, taking the short way round: from 359° a reading
 * of 1° gives 361°, not 1° (which would spin the dial all the way back).
 */
export const unwrap = (previous: number, next: number) => previous + signed(next - previous);

/** Calibration levels from expo-location: 0 none, 1 low, 2 medium, 3 high. */
export const needsCalibration = (accuracy: number | null | undefined) =>
  accuracy != null && accuracy <= 1;

/** "1,234" style whole kilometres, Latin digits like the rest of the app. */
export const formatKm = (km: number) =>
  Math.round(km)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
