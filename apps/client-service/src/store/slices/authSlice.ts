import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile, AuthState } from '@/types/auth';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  accessToken: null,
  loading: true,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: UserProfile; accessToken?: string }>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.loading = false;
      if (action.payload.accessToken) {
        state.accessToken = action.payload.accessToken;
      }
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.accessToken = null;
      state.loading = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setUser, updateProfile, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
