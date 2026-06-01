import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User, AuthState } from "@/types/user";
import { MOCK_CURRENT_USER } from "@/lib/mock-data/users";

const initialState: AuthState = {
  // Pre-populated with mock learner for development
  user: MOCK_CURRENT_USER as unknown as User,
  isAuthenticated: true,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    // For dev: switch between learner / studio / admin mode
    switchToLearner(state) {
      state.user = MOCK_CURRENT_USER as unknown as User;
      state.isAuthenticated = true;
    },
    switchToStudio(state) {
      state.user = {
        id: "user-owner-3",
        email: "ritu@designinstitute.in",
        name: "Ritu Kapoor",
        role: "owner" as any,
        status: "active",
        isEmailVerified: true,
      } as any;
      state.isAuthenticated = true;
    },
    switchToAdmin(state) {
      state.user = {
        id: "user-admin-1",
        email: "admin@learniox.com",
        name: "System Admin",
        role: "admin" as any,
        status: "active",
        isEmailVerified: true,
      } as any;
      state.isAuthenticated = true;
    },
  },
});

export const { setUser, clearUser, setLoading, setError, switchToLearner, switchToStudio, switchToAdmin } = authSlice.actions;
export default authSlice.reducer;
