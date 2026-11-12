import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { updateUserTelemetry } from './authSlice.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Gọi API lấy danh sách tầng
export const fetchBossFloorsThunk = createAsyncThunk(
  'boss/fetchFloors',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bosses/${userId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
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
      const response = await fetch(`${API_BASE_URL}/bosses/${floorNumber}/battle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, cardIds }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

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