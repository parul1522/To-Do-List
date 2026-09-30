/**
 * API contract shared between the backend (FastAPI/Pydantic) and the mobile
 * client. Keep in sync with `backend/app/schemas`. Field names use the API's
 * snake_case on the wire.
 */

export type UUID = string;
export type ISODateTime = string;

export interface User {
  id: UUID;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  /** Seconds until the access token expires. */
  expires_in: number;
}

export interface AuthResponse {
  user: User;
  tokens: TokenPair;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserUpdateRequest {
  name?: string;
  avatar_url?: string | null;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface ValidationIssue {
  field: string;
  message: string;
  type: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details: ValidationIssue[] | unknown | null;
  };
}
