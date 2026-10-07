import { createSlice } from '@reduxjs/toolkit';
import { settingsApi } from '@/api/settingsApi';
import { createThunk } from '../createThunk';

export const fetchSettings = createThunk('settings/fetch', () => settingsApi.get());

/** Loads the non-sensitive subset every role may read. */
export const fetchPublicSettings = createThunk('settings/fetchPublic', () => settingsApi.getPublic());

export const saveSettings = createThunk('settings/save', (payload) => settingsApi.update(payload));

export const uploadBrandingAsset = createThunk('settings/uploadBranding', ({ asset, file }) => settingsApi.uploadBranding(asset, file));

export const removeBrandingAsset = createThunk('settings/removeBranding', (asset) => settingsApi.removeBranding(asset));

const initialState = {
  settings: null,
  nextNumbers: {},
  loading: false,
  saving: false,
  error: null,
  fieldErrors: [],
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearSettingsError: (state) => {
      state.error = null;
      state.fieldErrors = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.settings = action.payload.settings;
        state.loading = false;
      })
      .addCase(fetchPublicSettings.fulfilled, (state, action) => {
        // Merge so a later full fetch cannot be clobbered by the public subset.
        state.settings = { ...action.payload.settings, ...(state.settings ?? {}) };
        state.nextNumbers = action.payload.nextNumbers ?? {};
      })

      // Every mutation returns the full settings document.
      .addMatcher(
        (action) =>
          /^settings\/(save|uploadBranding|removeBranding)\/fulfilled$/.test(action.type),
        (state, action) => {
          state.settings = action.payload.settings;
          state.saving = false;
          state.error = null;
          state.fieldErrors = [];
        },
      )
      .addMatcher(
        (action) => /^settings\/(save|uploadBranding|removeBranding)\/pending$/.test(action.type),
        (state) => {
          state.saving = true;
          state.error = null;
          state.fieldErrors = [];
        },
      )
      .addMatcher(
        (action) => action.type.startsWith('settings/') && action.type.endsWith('/rejected'),
        (state, action) => {
          state.loading = false;
          state.saving = false;
          state.error = action.payload?.message ?? 'Could not save settings';
          state.fieldErrors = action.payload?.errors ?? [];
        },
      );
  },
});

export const { clearSettingsError } = settingsSlice.actions;

export const selectSettings = (state) => state.settings.settings;
export const selectSettingsLoading = (state) => state.settings.loading;
export const selectSettingsSaving = (state) => state.settings.saving;
export const selectSettingsError = (state) => state.settings.error;
export const selectSettingsFieldErrors = (state) => state.settings.fieldErrors;
export const selectNextNumbers = (state) => state.settings.nextNumbers;

export default settingsSlice.reducer;
