import { createSlice } from '@reduxjs/toolkit';
import { createCrudSlice } from '@/redux/createCrudSlice';
import { createThunk } from '@/redux/createThunk';
import { wqMasters, wqQuoteApi, wqSettingsApi, wqThemeApi } from '../api/wqApi';

/** Redux keys are all prefixed `wq` (A1.2). */
export const wqItems = createCrudSlice({ name: 'wqItems', service: wqMasters.items, listKey: 'items', entityKey: 'item' });
export const wqSets = createCrudSlice({ name: 'wqSets', service: wqMasters.sets, listKey: 'items', entityKey: 'item' });
export const wqAddOns = createCrudSlice({ name: 'wqAddOns', service: wqMasters.addOns, listKey: 'items', entityKey: 'item' });
export const wqPresets = createCrudSlice({ name: 'wqPresets', service: wqMasters.presets, listKey: 'items', entityKey: 'item' });
export const wqQuotes = createCrudSlice({ name: 'wqQuotes', service: wqQuoteApi, listKey: 'quotes', entityKey: 'quote' });

export const fetchWqMe = createThunk('wqMeta/fetchMe', () => wqSettingsApi.me());
export const fetchWqThemes = createThunk('wqMeta/fetchThemes', () => wqThemeApi.list());
export const fetchWqStudio = createThunk('wqMeta/fetchStudio', () => wqSettingsApi.studio());

const metaSlice = createSlice({
  name: 'wqMeta',
  initialState: { me: null, role: null, meLoaded: false, themes: [], themesLoaded: false, studio: null },
  reducers: {
    themeUpserted: (state, action) => {
      const i = state.themes.findIndex((t) => t._id === action.payload._id);
      if (i === -1) state.themes.push(action.payload);
      else state.themes[i] = action.payload;
    },
    themeRemoved: (state, action) => {
      state.themes = state.themes.filter((t) => t._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWqMe.fulfilled, (state, action) => {
        state.me = action.payload.me;
        state.role = action.payload.role;
        state.meLoaded = true;
      })
      .addCase(fetchWqMe.rejected, (state) => {
        state.me = {};
        state.meLoaded = true;
      })
      .addCase(fetchWqThemes.fulfilled, (state, action) => {
        state.themes = action.payload.themes;
        state.themesLoaded = true;
      })
      .addCase(fetchWqStudio.fulfilled, (state, action) => {
        state.studio = action.payload.studio;
      });
  },
});

export const wqMetaActions = metaSlice.actions;

export const wqReducers = {
  wqItems: wqItems.reducer,
  wqSets: wqSets.reducer,
  wqAddOns: wqAddOns.reducer,
  wqPresets: wqPresets.reducer,
  wqQuotes: wqQuotes.reducer,
  wqMeta: metaSlice.reducer,
};
