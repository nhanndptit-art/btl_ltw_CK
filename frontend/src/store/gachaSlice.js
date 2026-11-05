import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { updateUserTelemetry } from './authSlice.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const fetchInventoryThunk = createAsyncThunk(
  'gacha/fetchInventory',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${userId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data.inventory;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const performGachaRollThunk = createAsyncThunk(
  'gacha/performRoll',
  async ({ userId, pullCount }, { dispatch, rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/gacha/roll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pullCount }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi triệu hồi thẻ bài.');
      }

      // Đồng bộ ngay số dư Gems và Pity Count sang authSlice
      dispatch(updateUserTelemetry(data.userState));
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchGachaHistoryThunk = createAsyncThunk(
  'gacha/fetchHistory',
  async ({ userId, page = 1 }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/gacha/history/${userId}?page=${page}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Lỗi khi tải lịch sử triệu hồi.');
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const gachaSlice = createSlice({
  name: 'gacha',
  initialState: {
    inventory: [],
    lastPullResults: [],
    history: [],
    historyPagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
    isHistoryLoading: false,
    historyError: null,
    isRolling: false,
    error: null,
  },
  reducers: {
    clearPullResults: (state) => {
      state.lastPullResults = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventoryThunk.fulfilled, (state, action) => {
        state.inventory = action.payload;
      })
      .addCase(fetchGachaHistoryThunk.pending, (state) => {
        state.isHistoryLoading = true;
        state.historyError = null;
      })
      .addCase(fetchGachaHistoryThunk.fulfilled, (state, action) => {
        state.isHistoryLoading = false;
        state.history = action.payload.history;
        state.historyPagination = action.payload.pagination;
      })
      .addCase(fetchGachaHistoryThunk.rejected, (state, action) => {
        state.isHistoryLoading = false;
        state.historyError = action.payload;
      })
      .addCase(performGachaRollThunk.pending, (state) => {
        state.isRolling = true;
        state.error = null;
      })
      .addCase(performGachaRollThunk.fulfilled, (state, action) => {
        state.isRolling = false;
        state.lastPullResults = action.payload.results;
        state.inventory = action.payload.inventory;
      })
      .addCase(performGachaRollThunk.rejected, (state, action) => {
        state.isRolling = false;
        state.error = action.payload;
      });
  },
});

export const { clearPullResults } = gachaSlice.actions;
export default gachaSlice.reducer;
