import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authApi } from '@/api/authApi';
import { tokenStore } from '@/api/axios';
import { createThunk } from '../createThunk';

export const login = createThunk('auth/login', (credentials) => {
  // A support workspace belongs to the current platform session. Never carry
  // it into a newly authenticated account on the same browser.
  tokenStore.clearBusinessContext();
  return authApi.login(credentials);
});

export const registerUser = createThunk('auth/register', (payload) => authApi.register(payload));

export const fetchMe = createThunk('auth/me', () => authApi.me());

export const updateProfile = createThunk('auth/updateProfile', (payload) =>
  authApi.updateProfile(payload),
);

export const updateAvatar = createThunk('auth/updateAvatar', (file) => authApi.updateAvatar(file));

export const changePassword = createThunk('auth/changePassword', (payload) =>
  authApi.changePassword(payload),
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout({ refreshToken: tokenStore.getRefresh() });
  } catch {
    // Signing out locally must succeed even if the server call fails.
  }
  tokenStore.clear();
});

const initialState = {
  user: null,
  business: null,
  // `initialising` covers the boot-time session check, distinct from the
  // `loading` flag used by interactive submissions.
  initialising: Boolean(tokenStore.getAccess()),
  loading: false,
  error: null,
  fieldErrors: [],
};

const applySession = (state, payload) => {
  state.user = payload.user;
  state.business = payload.business ?? null;
  state.loading = false;
  state.error = null;
  state.fieldErrors = [];
  tokenStore.set(payload);
  if (payload.user?.accountScope === 'business') tokenStore.clearBusinessContext();
};

const applyFailure = (state, action) => {
  state.loading = false;
  state.error = action.payload?.message ?? 'Something went wrong';
  state.fieldErrors = action.payload?.errors ?? [];
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
      state.fieldErrors = [];
    },
    // Dispatched by the axios interceptor when refreshing fails.
    sessionExpired: (state) => {
      state.user = null;
      state.business = null;
      state.initialising = false;
      tokenStore.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.initialising = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.business = action.payload.business ?? null;
        state.initialising = false;
        if (action.payload.user?.accountScope === 'business') tokenStore.clearBusinessContext();
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.business = null;
        state.initialising = false;
        tokenStore.clear();
      })

      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.business = null;
        state.error = null;
        state.fieldErrors = [];
      })

      .addCase(updateAvatar.fulfilled, (state, action) => {
        state.user = action.payload.user;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.loading = false;
      })

      // login / register / changePassword all return a full session payload.
      .addMatcher(
        (action) => /^auth\/(login|register|changePassword)\/fulfilled$/.test(action.type),
        (state, action) => {
          if (action.payload?.accessToken) applySession(state, action.payload);
          else state.loading = false;
        },
      )
      .addMatcher(
        (action) => action.type.startsWith('auth/') && action.type.endsWith('/pending'),
        (state) => {
          state.loading = true;
          state.error = null;
          state.fieldErrors = [];
        },
      )
      .addMatcher(
        (action) => action.type.startsWith('auth/') && action.type.endsWith('/rejected'),
        applyFailure,
      );
  },
});

export const { clearAuthError, sessionExpired } = authSlice.actions;

export const selectUser = (state) => state.auth.user;
export const selectBusiness = (state) => state.auth.business;
export const selectIsAuthenticated = (state) => Boolean(state.auth.user);
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthInitialising = (state) => state.auth.initialising;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthFieldErrors = (state) => state.auth.fieldErrors;

export default authSlice.reducer;
