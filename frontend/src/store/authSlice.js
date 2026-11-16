import { createSlice } from '@reduxjs/toolkit';

const savedUser = localStorage.getItem('cyber_user');
const savedToken = localStorage.getItem('cyber_token');

const initialState = {
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUserSession: (state, action) => {
      const payloadUser = action.payload?.user ? action.payload.user : action.payload;
      const payloadToken = action.payload?.token || null;

      const normalizedUser = {
        ...payloadUser,
        role: payloadUser?.role || 'user',
      };

      state.user = normalizedUser;
      localStorage.setItem('cyber_user', JSON.stringify(normalizedUser));

      if (payloadToken) {
        state.token = payloadToken;
        localStorage.setItem('cyber_token', payloadToken);
      }
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
      state.token = null;
      localStorage.removeItem('cyber_user');
      localStorage.removeItem('cyber_token');
    },
  },
});

export const { setUserSession, updateUserTelemetry, logoutUser } = authSlice.actions;
export default authSlice.reducer;