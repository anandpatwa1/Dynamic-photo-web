import { documentApi } from '@/api/documentApi';
import { createCrudSlice } from '../createCrudSlice';
import { createThunk } from '../createThunk';

const replaceInList = (state, updated) => {
  const index = state.items.findIndex((item) => item._id === updated._id);
  if (index !== -1) state.items[index] = updated;
  if (state.current?._id === updated._id) state.current = updated;
  state.saving = false;
};

export const fetchDocumentStats = createThunk(
  'documents/fetchStats',
  () => documentApi.stats(),
);

export const updateDocumentStatus = createThunk(
  'documents/updateStatus',
  ({ id, status }) => documentApi.updateStatus(id, status),
);

export const convertDocument = createThunk(
  'documents/convert',
  ({ id, type, date }) => documentApi.convert(id, { type, date }),
);

export const duplicateDocument = createThunk(
  'documents/duplicate',
  (id) => documentApi.duplicate(id),
);

const { reducer, actions, thunks, selectors } = createCrudSlice({
  name: 'documents',
  service: documentApi,
  listKey: 'documents',
  entityKey: 'document',
  initialState: { stats: null },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocumentStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(updateDocumentStatus.fulfilled, (state, action) => {
        replaceInList(state, action.payload.document);
      })
      .addCase(duplicateDocument.fulfilled, (state, action) => {
        state.items.unshift(action.payload.document);
        state.saving = false;
      })
      .addCase(convertDocument.fulfilled, (state, action) => {
        // The new document belongs at the top of the list; the source's
        // `convertedTo` link is refreshed by the detail page's refetch.
        state.items.unshift(action.payload.document);
        state.saving = false;
      });
  },
});

export const {
  fetchList: fetchDocuments,
  fetchOne: fetchDocument,
  create: createDocument,
  update: updateDocument,
  remove: deleteDocument,
} = thunks;

export const { clearError: clearDocumentError, clearCurrent: clearCurrentDocument } = actions;

export const {
  selectItems: selectDocuments,
  selectMeta: selectDocumentsMeta,
  selectCurrent: selectCurrentDocument,
  selectLoading: selectDocumentsLoading,
  selectLoadingOne: selectDocumentLoading,
  selectSaving: selectDocumentSaving,
  selectError: selectDocumentError,
  selectFieldErrors: selectDocumentFieldErrors,
} = selectors;

export const selectDocumentStats = (state) => state.documents.stats;

export default reducer;
