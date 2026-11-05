const DEFAULT_API_URL = 'https://drink-to-you-api.onrender.com/api';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;

// A API gratuita "dorme" quando fica parada; o primeiro acesso pode demorar.
export const REQUEST_TIMEOUT_MS = 60_000;
export const SLOW_REQUEST_HINT_MS = 4_000;

export const FALLBACK_LOCATION = { latitude: -23.5505, longitude: -46.6333, city: 'São Paulo' };
