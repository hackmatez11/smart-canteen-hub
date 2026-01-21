import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './slices/cartSlice';
import orderReducer from './slices/orderSlice';
import menuReducer from './slices/menuSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    order: orderReducer,
    menu: menuReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
