import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import gachaReducer from './gachaSlice.js';
import bossReducer from './bossSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    gacha: gachaReducer,
    boss: bossReducer,
  },
});