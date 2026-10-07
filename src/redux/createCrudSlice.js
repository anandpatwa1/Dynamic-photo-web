import { createSlice } from '@reduxjs/toolkit';
import { createThunk } from './createThunk';

/**
 * Builds a standard list/detail CRUD slice.
 *
 * Every resource module in this app has the same shape — a paginated list, a
 * selected record, create/update/delete, and normalised error handling — so it
 * is defined once here and configured per resource.
 *
 * @param name       slice name, e.g. 'clients'
 * @param service    API object exposing list/get/create/update/remove
 * @param listKey    key holding the array in the list response, e.g. 'clients'
 * @param entityKey  key holding the record in a single response, e.g. 'client'
 */
export const createCrudSlice = ({
  name,
  service,
  listKey,
  entityKey,
  initialState: extraInitialState = {},
  extraReducers: buildExtraReducers,
}) => {
  const thunks = {
    fetchList: createThunk(`${name}/fetchList`, (params) => service.list(params)),
    fetchOne: createThunk(`${name}/fetchOne`, (id) => service.get(id)),
    create: createThunk(`${name}/create`, (payload) => service.create(payload)),
    update: createThunk(`${name}/update`, ({ id, payload }) => service.update(id, payload)),
    remove: createThunk(`${name}/remove`, async (id) => {
      await service.remove(id);
      return id;
    }),
  };

  const initialState = {
    items: [],
    meta: null,
    current: null,
    loading: false,
    loadingOne: false,
    saving: false,
    error: null,
    fieldErrors: [],
    ...extraInitialState,
  };

  const slice = createSlice({
    name,
    initialState,
    reducers: {
      clearError: (state) => {
        state.error = null;
        state.fieldErrors = [];
      },
      clearCurrent: (state) => {
        state.current = null;
      },
      setCurrent: (state, action) => {
        state.current = action.payload;
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(thunks.fetchList.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(thunks.fetchList.fulfilled, (state, action) => {
          state.items = action.payload.data?.[listKey] ?? [];
          state.meta = action.payload.meta ?? null;
          state.loading = false;
        })

        .addCase(thunks.fetchOne.pending, (state) => {
          state.loadingOne = true;
          state.error = null;
        })
        .addCase(thunks.fetchOne.fulfilled, (state, action) => {
          state.current = action.payload[entityKey];
          state.loadingOne = false;
        })
        .addCase(thunks.fetchOne.rejected, (state) => {
          state.loadingOne = false;
        })

        .addCase(thunks.create.fulfilled, (state, action) => {
          // Prepend so the new record is visible without a refetch.
          state.items.unshift(action.payload[entityKey]);
          if (state.meta) state.meta.total += 1;
          state.saving = false;
        })

        .addCase(thunks.update.fulfilled, (state, action) => {
          const updated = action.payload[entityKey];
          const index = state.items.findIndex((item) => item._id === updated._id);
          if (index !== -1) state.items[index] = updated;
          if (state.current?._id === updated._id) state.current = updated;
          state.saving = false;
        })

        .addCase(thunks.remove.fulfilled, (state, action) => {
          state.items = state.items.filter((item) => item._id !== action.payload);
          if (state.meta) state.meta.total = Math.max(0, state.meta.total - 1);
          if (state.current?._id === action.payload) state.current = null;
          state.saving = false;
        });

      // Module-specific cases are registered before the catch-all matchers,
      // which RTK requires.
      buildExtraReducers?.(builder, { thunks });

      builder
        .addMatcher(
          (action) =>
            action.type.startsWith(`${name}/`) &&
            action.type.endsWith('/pending') &&
            !action.type.includes('fetch'),
          (state) => {
            state.saving = true;
            state.error = null;
            state.fieldErrors = [];
          },
        )
        .addMatcher(
          (action) => action.type.startsWith(`${name}/`) && action.type.endsWith('/rejected'),
          (state, action) => {
            state.loading = false;
            state.saving = false;
            state.error = action.payload?.message ?? 'Something went wrong';
            state.fieldErrors = action.payload?.errors ?? [];
          },
        );
    },
  });

  const selectSlice = (state) => state[name];

  return {
    slice,
    reducer: slice.reducer,
    actions: slice.actions,
    thunks,
    selectors: {
      selectItems: (state) => selectSlice(state).items,
      selectMeta: (state) => selectSlice(state).meta,
      selectCurrent: (state) => selectSlice(state).current,
      selectLoading: (state) => selectSlice(state).loading,
      selectLoadingOne: (state) => selectSlice(state).loadingOne,
      selectSaving: (state) => selectSlice(state).saving,
      selectError: (state) => selectSlice(state).error,
      selectFieldErrors: (state) => selectSlice(state).fieldErrors,
    },
  };
};
