import { TodaySummary, WaterEntry, WaterEntryInput, WeeklySummary } from '../types';
import { getDeviceTimezone, request } from './api';

const timezoneQuery = () => `?tz=${encodeURIComponent(getDeviceTimezone())}`;

export const waterService = {
  list: () => request<WaterEntry[]>('/water-entries'),
  get: (id: number) => request<WaterEntry>(`/water-entries/${id}`),
  create: (input: WaterEntryInput) =>
    request<WaterEntry>('/water-entries', { method: 'POST', body: input }),
  update: (id: number, input: WaterEntryInput) =>
    request<WaterEntry>(`/water-entries/${id}`, { method: 'PUT', body: input }),
  remove: (id: number) => request<void>(`/water-entries/${id}`, { method: 'DELETE' }),
  today: () => request<TodaySummary>(`/water-entries/summary/today${timezoneQuery()}`),
  weekly: () => request<WeeklySummary>(`/water-entries/summary/weekly${timezoneQuery()}`),
};
