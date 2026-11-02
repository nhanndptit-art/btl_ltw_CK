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
      const { gems, pity_count } = action.payload;
      if (state.user) {
        state.user.gems = gems;
        state.user.pity_count = pity_count;
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
