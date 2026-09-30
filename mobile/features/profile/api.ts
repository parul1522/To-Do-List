import type { PasswordChangeRequest, TokenPair, User, UserUpdateRequest } from '@shared/types/api';

import { api } from '@/services/api/client';

export const profileApi = {
  me: () => api.get<User>('/users/me'),
  update: (data: UserUpdateRequest) => api.patch<User>('/users/me', data),
  changePassword: (data: PasswordChangeRequest) => api.post<TokenPair>('/users/me/password', data),
  deleteAccount: (password: string) => api.delete<void>('/users/me', { password }),
};
