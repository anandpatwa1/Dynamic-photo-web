import { clientApi } from '@/api/clientApi';
import { createCrudSlice } from '../createCrudSlice';
import { createThunk } from '../createThunk';

export const fetchClientStats = createThunk(
  'clients/fetchStats',
  () => clientApi.stats(),
);

export const fetchClientOptions = createThunk(
  'clients/fetchOptions',
  () => clientApi.options(),
);

export const archiveClient = createThunk(
  'clients/archive',
  (id) => clientApi.archive(id),
);

const { reducer, actions, thunks, selectors } = createCrudSlice({
  name: 'clients',
  service: clientApi,
  listKey: 'clients',
  entityKey: 'client',
  initialState: { stats: null, options: [] },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchClientOptions.fulfilled, (state, action) => {
        state.options = action.payload.clients ?? [];
      })
      .addCase(archiveClient.fulfilled, (state, action) => {
        const archived = action.payload.client;
        const index = state.items.findIndex((item) => item._id === archived._id);
        if (index !== -1) state.items[index] = archived;
        if (state.current?._id === archived._id) state.current = archived;
        state.saving = false;
      });
  },
});

export const {
  fetchList: fetchClients,
  fetchOne: fetchClient,
  create: createClient,
  update: updateClient,
  remove: deleteClient,
} = thunks;

export const { clearError: clearClientError, clearCurrent: clearCurrentClient } = actions;

export const {
  selectItems: selectClients,
  selectMeta: selectClientsMeta,
  selectCurrent: selectCurrentClient,
  selectLoading: selectClientsLoading,
  selectLoadingOne: selectClientLoading,
  selectSaving: selectClientSaving,
  selectError: selectClientError,
  selectFieldErrors: selectClientFieldErrors,
} = selectors;

export const selectClientStats = (state) => state.clients.stats;
export const selectClientOptions = (state) => state.clients.options;

export default reducer;
