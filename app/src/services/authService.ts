import { AuthResponse, User } from '../types';
import { request } from './api';

export const authService = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      skipUnauthorizedHandler: true,
    }),

  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: { name, email, password },
      skipUnauthorizedHandler: true,
    }),

  me: () => request<{ user: User }>('/auth/me', { skipUnauthorizedHandler: true }),
};
