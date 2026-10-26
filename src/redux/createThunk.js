import { createAsyncThunk } from '@reduxjs/toolkit';
import { parseApiError } from '@/api/axios';

/**
 * Creates an async thunk whose rejections always carry the normalised
 * `{ message, errors, status }` shape that toasts and `useServerErrors`
 * expect.
 *
 * Every slice previously repeated this wrapper verbatim; it lives here once so
 * error handling cannot drift between modules.
 */
export const createThunk = (type, handler) =>
  createAsyncThunk(type, async (arg, thunkApi) => {
    try {
      return await handler(arg, thunkApi);
    } catch (error) {
      return thunkApi.rejectWithValue(parseApiError(error));
    }
  });
