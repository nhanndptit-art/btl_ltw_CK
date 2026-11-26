// File: frontend/src/store/bossSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { updateUserTelemetry } from './authSlice.js';
import { authFetch } from '../utils/apiClient.js';

// Gọi API lấy danh sách tầng
export const fetchBossFloorsThunk = createAsyncThunk(
  'boss/fetchFloors',
  async (userId, { dispatch, rejectWithValue }) => {
    try {
      const data = await authFetch(`/bosses/${userId}`);
      dispatch(updateUserTelemetry(data));
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Gọi API đánh Boss
export const battleBossThunk = createAsyncThunk(
  'boss/battle',
  async ({ userId, floorNumber, cardIds }, { dispatch, rejectWithValue }) => {
    try {
      const data = await authFetch(`/bosses/${floorNumber}/battle`, {
        method: 'POST',
        body: JSON.stringify({ userId, cardIds }),
      });

      // Cập nhật số Gem và Tiến độ tầng lên góc phải màn hình
      dispatch(updateUserTelemetry(data.userState));
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const bossSlice = createSlice({
  name: 'boss',
  initialState: {
    bosses: [],
    highestFloor: 0,
    isLoading: false,
    isBattling: false,
    error: null,
    lastBattleResult: null,
  },
  reducers: {
    clearBattleResult: (state) => {
      state.lastBattleResult = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBossFloorsThunk.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchBossFloorsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bosses = action.payload.bosses;
        state.highestFloor = action.payload.highest_boss_floor;
      })
      .addCase(fetchBossFloorsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(battleBossThunk.pending, (state) => { state.isBattling = true; state.error = null; })
      .addCase(battleBossThunk.fulfilled, (state, action) => {
        state.isBattling = false;
        state.lastBattleResult = action.payload;
        state.highestFloor = action.payload.userState.highest_boss_floor;
        
        // Tự động mở khóa tầng tiếp theo trên UI sau khi thắng
        state.bosses = state.bosses.map((b) => {
          if (b.floor_number <= state.highestFloor) {
            return { ...b, status: 'CLEARED', next_reward_gems: b.repeat_gems };
          }
          if (b.floor_number === state.highestFloor + 1) {
            return { ...b, status: 'AVAILABLE', next_reward_gems: b.first_clear_gems };
          }
          return b;
        });
      })
      .addCase(battleBossThunk.rejected, (state, action) => {
        state.isBattling = false;
        state.error = action.payload;
      });
  },
});

export const { clearBattleResult } = bossSlice.actions;
export default bossSlice.reducer;