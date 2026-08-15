export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error: {
    code: string;
    details: string[];
  } | null;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  provider?: string;
  signup_method?: string;
  last_login_method?: string;
  is_active: boolean;
  is_verified?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  name: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  loading: boolean;
}
