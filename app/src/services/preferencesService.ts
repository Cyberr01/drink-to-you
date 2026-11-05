import { Preferences } from '../types';
import { request } from './api';
import { storage } from './storage';

export const preferencesService = {
  get: () => request<Preferences>('/preferences'),

  async update(preferences: Preferences) {
    const saved = await request<Preferences>('/preferences', { method: 'PUT', body: preferences });
    await storage.setPreferences(saved);
    return saved;
  },
};
