import * as ExpoLocation from 'expo-location';

/** "Calgary, AB" for a coordinate, or undefined if the platform geocoder can't tell. */
export const cityName = async ({
  lat,
  lng,
}: GeoLocation): Promise<string | undefined> => {
  try {
    const [place] = await ExpoLocation.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });
    if (!place) {
      return undefined;
    }
    const city = place.city ?? place.subregion ?? place.district;
    const region =
      place.region && place.region.length <= 3
        ? place.region
        : place.isoCountryCode ?? place.region;
    return [city, region].filter(Boolean).join(', ') || undefined;
  } catch {
    return undefined;
  }
};
