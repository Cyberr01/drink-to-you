import { FALLBACK_LOCATION } from '../config';

export interface Weather {
  city: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
  };
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

const WEATHER_CODES: { max: number; description: string; icon: string }[] = [
  { max: 0, description: 'Céu limpo', icon: 'weather-sunny' },
  { max: 3, description: 'Parcialmente nublado', icon: 'weather-partly-cloudy' },
  { max: 48, description: 'Nevoeiro', icon: 'weather-fog' },
  { max: 57, description: 'Garoa', icon: 'weather-rainy' },
  { max: 67, description: 'Chuva', icon: 'weather-pouring' },
  { max: 77, description: 'Neve', icon: 'weather-snowy' },
  { max: 82, description: 'Pancadas de chuva', icon: 'weather-pouring' },
  { max: 99, description: 'Tempestade', icon: 'weather-lightning-rainy' },
];

function describeWeatherCode(code: number) {
  return WEATHER_CODES.find((item) => code <= item.max) ?? WEATHER_CODES[0];
}

export async function fetchWeather(
  coordinates: Coordinates,
  city: string = FALLBACK_LOCATION.city,
): Promise<Weather> {
  const { latitude, longitude } = coordinates;
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${latitude}&longitude=${longitude}` +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code&timezone=auto';

  const response = await fetch(url);
  if (!response.ok) throw new Error('Não foi possível obter o clima agora.');

  const { current } = (await response.json()) as OpenMeteoResponse;
  const { description, icon } = describeWeatherCode(current.weather_code);

  return {
    city,
    temperature: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    humidity: current.relative_humidity_2m,
    description,
    icon,
  };
}
