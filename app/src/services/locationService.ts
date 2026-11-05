import * as Location from 'expo-location';
import { FALLBACK_LOCATION } from '../config';

export interface ResolvedLocation {
  latitude: number;
  longitude: number;
  city: string;
}

async function resolveCityName(latitude: number, longitude: number) {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    return place?.city ?? place?.subregion ?? place?.region ?? 'Sua localização';
  } catch {
    return 'Sua localização';
  }
}

export async function getCurrentLocation(): Promise<ResolvedLocation> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return FALLBACK_LOCATION;

    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low,
    });
    const city = await resolveCityName(coords.latitude, coords.longitude);
    return { latitude: coords.latitude, longitude: coords.longitude, city };
  } catch {
    return FALLBACK_LOCATION;
  }
}
