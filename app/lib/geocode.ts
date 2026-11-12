import * as ExpoLocation from 'expo-location';

export type Place = {
  /** "Calgary, AB" */
  city?: string;
  /** ISO 3166 alpha-2, e.g. "CA". */
  countryCode?: string;
  /** "Canada" */
  country?: string;
};

const describe = (place: ExpoLocation.LocationGeocodedAddress): Place => {
  const city = place.city ?? place.subregion ?? place.district;
  const region =
    place.region && place.region.length <= 3
      ? place.region
      : (place.isoCountryCode ?? place.region);
  return {
    city: [city, region].filter(Boolean).join(', ') || undefined,
    countryCode: place.isoCountryCode ?? undefined,
    country: place.country ?? undefined,
  };
};

/** City and country for a coordinate. Empty if the platform geocoder can't tell. */
export const placeFor = async ({lat, lng}: GeoLocation): Promise<Place> => {
  try {
    const [place] = await ExpoLocation.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });
    return place ? describe(place) : {};
  } catch {
    return {};
  }
};

/** "Calgary, AB" for a coordinate, or undefined if the platform geocoder can't tell. */
export const cityName = async (location: GeoLocation) => (await placeFor(location)).city;

/** The first match for a typed city name, or null. Uses the platform geocoder. */
export const searchPlace = async (
  query: string,
): Promise<{location: GeoLocation; place: Place} | null> => {
  try {
    const [hit] = await ExpoLocation.geocodeAsync(query.trim());
    if (!hit) {
      return null;
    }
    const location = {lat: hit.latitude, lng: hit.longitude};
    const place = await placeFor(location);
    return {location, place: {...place, city: place.city ?? query.trim()}};
  } catch {
    return null;
  }
};

// City-level accuracy is enough. Never ask the user to turn on Google Location
// Accuracy: declining that dialog fails the request outright. Try a recent fix,
// then low power (network), then GPS for devices without network location.
export const findPosition = async (): Promise<ExpoLocation.LocationObject> => {
  const lastKnown = await ExpoLocation.getLastKnownPositionAsync({
    maxAge: 10 * 60 * 1000,
  });
  if (lastKnown) {
    return lastKnown;
  }
  const request = (accuracy: ExpoLocation.Accuracy) =>
    ExpoLocation.getCurrentPositionAsync({
      accuracy,
      mayShowUserSettingsDialog: false,
    });
  try {
    return await request(ExpoLocation.Accuracy.Low);
  } catch {
    return request(ExpoLocation.Accuracy.High);
  }
};
