import { createSlice } from '@reduxjs/toolkit';

const readSavedUser = () => {
  try {
    const savedUser = localStorage.getItem('cyber_user');
    if (!savedUser) return null;

    const parsedUser = JSON.parse(savedUser);
    if (!parsedUser || typeof parsedUser !== 'object') return null;

    return {
      ...parsedUser,
      role: parsedUser.role || 'user',
    };
  } catch {
    localStorage.removeItem('cyber_user');
    return null;
  }
};

const savedToken = localStorage.getItem('cyber_token');

const initialState = {
  user: readSavedUser(),
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