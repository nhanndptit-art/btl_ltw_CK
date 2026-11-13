import { createSlice } from '@reduxjs/toolkit';

const savedUser = localStorage.getItem('cyber_user');

const initialState = {
  user: savedUser ? JSON.parse(savedUser) : null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUserSession: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('cyber_user', JSON.stringify(action.payload));
    },
    updateUserTelemetry: (state, action) => {
      const { gems, pity_count, highest_boss_floor, stamina } = action.payload;
      if (state.user) {
        if (gems !== undefined) state.user.gems = gems;
        if (pity_count !== undefined) state.user.pity_count = pity_count;
        if (highest_boss_floor !== undefined) state.user.highest_boss_floor = highest_boss_floor;
        if (stamina !== undefined) state.user.stamina = stamina;
        
        localStorage.setItem('cyber_user', JSON.stringify(state.user));
      }
    },
    logoutUser: (state) => {
      state.user = null;
      localStorage.removeItem('cyber_user');
    },
  },
});

export const { setUserSession, updateUserTelemetry, logoutUser } = authSlice.actions;
export default authSlice.reducer;
