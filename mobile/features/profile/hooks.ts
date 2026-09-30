import type { PasswordChangeRequest, UserUpdateRequest } from '@shared/types/api';
import { useMutation } from '@tanstack/react-query';

import { authApi } from '@/features/auth/api';
import { tokenStore } from '@/services/api/tokens';
import { useAuthStore } from '@/store/authStore';

import { profileApi } from './api';

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (data: UserUpdateRequest) => profileApi.update(data),
    onSuccess: (user) => setUser(user),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: PasswordChangeRequest) => profileApi.changePassword(data),
    // Every other session was revoked server-side; keep this device signed in.
    onSuccess: (tokens) => tokenStore.save(tokens),
  });
}

export function useSignOutEverywhere() {
  const clearSession = useAuthStore((s) => s.clearSession);
  return useMutation({
    mutationFn: () => authApi.logoutAll(),
    onSuccess: () => clearSession(),
  });
}

export function useDeleteAccount() {
  const clearSession = useAuthStore((s) => s.clearSession);
  return useMutation({
    mutationFn: (password: string) => profileApi.deleteAccount(password),
    onSuccess: () => clearSession(),
  });
}
