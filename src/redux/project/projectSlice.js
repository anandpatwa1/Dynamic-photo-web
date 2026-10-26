import { projectApi } from '@/api/projectApi';
import { createCrudSlice } from '../createCrudSlice';
import { createThunk } from '../createThunk';

const replaceInList = (state, updated) => {
  const index = state.items.findIndex((item) => item._id === updated._id);
  if (index !== -1) state.items[index] = updated;
  if (state.current?._id === updated._id) state.current = updated;
  state.saving = false;
};

export const fetchProjectStats = createThunk(
  'projects/fetchStats',
  () => projectApi.stats(),
);

export const updateProjectStatus = createThunk(
  'projects/updateStatus',
  ({ id, status }) => projectApi.updateStatus(id, status),
);

export const toggleDeliverable = createThunk(
  'projects/toggleDeliverable',
  ({ id, deliverableId, isDone }) =>
    projectApi.toggleDeliverable(id, deliverableId, isDone),
);

const { reducer, actions, thunks, selectors } = createCrudSlice({
  name: 'projects',
  service: projectApi,
  listKey: 'projects',
  entityKey: 'project',
  initialState: { stats: null, documents: [] },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(updateProjectStatus.fulfilled, (state, action) => {
        replaceInList(state, action.payload.project);
      })
      .addCase(toggleDeliverable.fulfilled, (state, action) => {
        replaceInList(state, action.payload.project);
      })
      // The detail endpoint returns the project's documents alongside it.
      // A matcher rather than `addCase` — the base slice already registers a
      // case for this exact action, and RTK forbids two cases for one type.
      .addMatcher(
        (action) => action.type === 'projects/fetchOne/fulfilled',
        (state, action) => {
          state.documents = action.payload.documents ?? [];
        },
      );
  },
});

export const {
  fetchList: fetchProjects,
  fetchOne: fetchProject,
  create: createProject,
  update: updateProject,
  remove: deleteProject,
} = thunks;

export const { clearError: clearProjectError, clearCurrent: clearCurrentProject } = actions;

export const {
  selectItems: selectProjects,
  selectMeta: selectProjectsMeta,
  selectCurrent: selectCurrentProject,
  selectLoading: selectProjectsLoading,
  selectLoadingOne: selectProjectLoading,
  selectSaving: selectProjectSaving,
  selectError: selectProjectError,
  selectFieldErrors: selectProjectFieldErrors,
} = selectors;

export const selectProjectStats = (state) => state.projects.stats;
export const selectProjectDocuments = (state) => state.projects.documents;

export default reducer;
