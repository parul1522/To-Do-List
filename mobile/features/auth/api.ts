import type { AuthResponse, LoginRequest, RegisterRequest } from '@shared/types/api';

import { api } from '@/services/api/client';

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data, { auth: false }),
  register: (data: RegisterRequest) => api.post<AuthResponse>('/auth/register', data, { auth: false }),
  logout: (refreshToken: string) =>
    api.post<void>('/auth/logout', { refresh_token: refreshToken }, { auth: false }),
  logoutAll: () => api.post<void>('/auth/logout-all'),
};
