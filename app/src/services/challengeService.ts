import {
  ChallengeDetailsResponse,
  ChallengeSummary,
  CreateChallengeInput,
} from '../types';
import { getDeviceTimezone, request } from './api';

const tzQuery = () => `?tz=${encodeURIComponent(getDeviceTimezone())}`;

export const challengeService = {
  list: () => request<ChallengeSummary[]>(`/challenges${tzQuery()}`),

  create: (input: CreateChallengeInput) =>
    request<ChallengeSummary>(`/challenges${tzQuery()}`, {
      method: 'POST',
      body: input,
    }),

  join: (code: string) =>
    request<ChallengeSummary>(`/challenges/join${tzQuery()}`, {
      method: 'POST',
      body: { code },
    }),

  leave: (challengeId: number) =>
    request<void>(`/challenges/${challengeId}/leave`, { method: 'DELETE' }),

  details: (challengeId: number) =>
    request<ChallengeDetailsResponse>(`/challenges/${challengeId}${tzQuery()}`),

  createCheckin: (challengeId: number, photo_data: string, caption?: string) =>
    request<{ id: number }>(`/challenges/${challengeId}/checkins${tzQuery()}`, {
      method: 'POST',
      body: { photo_data, caption: caption || null },
    }),

  toggleReaction: (challengeId: number, checkinId: number) =>
    request<{ reacted: boolean }>(`/challenges/${challengeId}/checkins/${checkinId}/react`, {
      method: 'POST',
    }),
};
