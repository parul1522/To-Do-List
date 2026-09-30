import type { LoginRequest, RegisterRequest } from '@shared/types/api';
import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '@/store/authStore';

import { authApi } from './api';

export function useSignIn() {
  const startSession = useAuthStore((s) => s.startSession);
  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login({ ...data, email: data.email.trim() }),
    onSuccess: ({ user, tokens }) => startSession(user, tokens),
  });
}

export function useSignUp() {
  const startSession = useAuthStore((s) => s.startSession);
  return useMutation({
    mutationFn: (data: RegisterRequest) =>
      authApi.register({ ...data, name: data.name.trim(), email: data.email.trim() }),
    onSuccess: ({ user, tokens }) => startSession(user, tokens),
  });
}
