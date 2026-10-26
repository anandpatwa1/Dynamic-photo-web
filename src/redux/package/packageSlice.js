import { packageApi } from '@/api/packageApi';
import { createCrudSlice } from '../createCrudSlice';
import { createThunk } from '../createThunk';

export const fetchPackageStats = createThunk(
  'packages/fetchStats',
  () => packageApi.stats(),
);

export const fetchPackageOptions = createThunk(
  'packages/fetchOptions',
  () => packageApi.options(),
);

export const duplicatePackage = createThunk(
  'packages/duplicate',
  (id) => packageApi.duplicate(id),
);

const { reducer, actions, thunks, selectors } = createCrudSlice({
  name: 'packages',
  service: packageApi,
  listKey: 'packages',
  entityKey: 'package',
  initialState: { stats: null, options: [] },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPackageStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchPackageOptions.fulfilled, (state, action) => {
        state.options = action.payload.packages ?? [];
      })
      .addCase(duplicatePackage.fulfilled, (state, action) => {
        state.items.unshift(action.payload.package);
        state.saving = false;
      });
  },
});

export const {
  fetchList: fetchPackages,
  fetchOne: fetchPackage,
  create: createPackage,
  update: updatePackage,
  remove: deletePackage,
} = thunks;

export const { clearError: clearPackageError, clearCurrent: clearCurrentPackage } = actions;

export const {
  selectItems: selectPackages,
  selectMeta: selectPackagesMeta,
  selectCurrent: selectCurrentPackage,
  selectLoading: selectPackagesLoading,
  selectSaving: selectPackageSaving,
  selectError: selectPackageError,
  selectFieldErrors: selectPackageFieldErrors,
} = selectors;

export const selectPackageStats = (state) => state.packages.stats;
export const selectPackageOptions = (state) => state.packages.options;

export default reducer;
