import { AchievementsResponse } from '../types';
import { getDeviceTimezone, request } from './api';

export const achievementService = {
  list: () =>
    request<AchievementsResponse>(
      `/achievements?tz=${encodeURIComponent(getDeviceTimezone())}`,
    ),
};
