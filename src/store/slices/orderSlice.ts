import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem } from './cartSlice';

export type OrderStatus = 'placed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentMethod = 'upi' | 'wallet' | 'cash';

export interface Order {
  id: string;
  token: string;
  items: CartItem[];
  status: OrderStatus;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  pickupTime: string;
  createdAt: string;
  estimatedTime: number; // in minutes
  canCancel: boolean;
}

interface OrderState {
  currentOrder: Order | null;
  orderHistory: Order[];
  isPlacingOrder: boolean;
}

const initialState: OrderState = {
  currentOrder: null,
  orderHistory: [],
  isPlacingOrder: false,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    placeOrder: (state, action: PayloadAction<Order>) => {
      state.currentOrder = action.payload;
      state.isPlacingOrder = false;
    },
    updateOrderStatus: (state, action: PayloadAction<{ id: string; status: OrderStatus }>) => {
      if (state.currentOrder?.id === action.payload.id) {
        state.currentOrder.status = action.payload.status;
        if (action.payload.status === 'preparing') {
          state.currentOrder.canCancel = false;
        }
      }
    },
    cancelOrder: (state, action: PayloadAction<string>) => {
      if (state.currentOrder?.id === action.payload && state.currentOrder.canCancel) {
        state.currentOrder.status = 'cancelled';
        state.orderHistory.push(state.currentOrder);
        state.currentOrder = null;
      }
    },
    completeOrder: (state) => {
      if (state.currentOrder) {
        state.currentOrder.status = 'completed';
        state.orderHistory.push(state.currentOrder);
        state.currentOrder = null;
      }
    },
    setPlacingOrder: (state, action: PayloadAction<boolean>) => {
      state.isPlacingOrder = action.payload;
    },
  },
});

export const { placeOrder, updateOrderStatus, cancelOrder, completeOrder, setPlacingOrder } = orderSlice.actions;
export default orderSlice.reducer;
