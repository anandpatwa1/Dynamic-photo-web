import { paymentApi } from '@/api/paymentApi';
import { createCrudSlice } from '../createCrudSlice';
import { createThunk } from '../createThunk';

export const fetchPaymentStats = createThunk(
  'payments/fetchStats',
  () => paymentApi.stats(),
);

const { reducer, actions, thunks, selectors } = createCrudSlice({
  name: 'payments',
  service: paymentApi,
  listKey: 'payments',
  entityKey: 'payment',
  initialState: { stats: null },
  extraReducers: (builder) => {
    builder.addCase(fetchPaymentStats.fulfilled, (state, action) => {
      state.stats = action.payload;
    });
  },
});

export const {
  fetchList: fetchPayments,
  fetchOne: fetchPayment,
  create: createPayment,
  update: updatePayment,
  remove: deletePayment,
} = thunks;

export const { clearError: clearPaymentError } = actions;

export const {
  selectItems: selectPayments,
  selectMeta: selectPaymentsMeta,
  selectLoading: selectPaymentsLoading,
  selectSaving: selectPaymentSaving,
  selectError: selectPaymentError,
  selectFieldErrors: selectPaymentFieldErrors,
} = selectors;

export const selectPaymentStats = (state) => state.payments.stats;

export default reducer;
