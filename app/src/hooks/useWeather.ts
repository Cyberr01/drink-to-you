import { fetchWeather, Weather } from '../services/weatherService';
import { getCurrentLocation } from '../services/locationService';
import { useFetch } from './useFetch';

async function loadWeather(): Promise<Weather> {
  const location = await getCurrentLocation();
  return fetchWeather(location, location.city);
}

export function useWeather() {
  return useFetch(loadWeather);
}
