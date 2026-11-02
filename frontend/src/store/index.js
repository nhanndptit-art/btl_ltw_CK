import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import gachaReducer from './gachaSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    gacha: gachaReducer,
  },
});
