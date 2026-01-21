import api from '../lib/api';

export interface OrderItem {
  food_item_id: string;
  quantity: number;
  customizations?: string;
  special_instructions?: string;
}

export interface CreateOrderData {
  items: OrderItem[];
  pickup_time: string;
  payment_method: 'online' | 'cash';
  group_order_id?: string;
  special_instructions?: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_token: string;
  total_amount: number;
  pickup_time: string;
  estimated_ready_time?: string;
  payment_method: string;
  payment_status: string;
  status: string;
  created_at: string;
  order_items: any[];
}

class OrderService {
  async createOrder(data: CreateOrderData) {
    const response = await api.post('/orders', data);
    return response.data;
  }

  async getUserOrders(status?: string) {
    const response = await api.get('/orders/my-orders', { params: { status } });
    return response.data;
  }

  async getOrderById(id: string) {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  }

  async cancelOrder(id: string) {
    const response = await api.post(`/orders/${id}/cancel`);
    return response.data;
  }

  async getPickupTimeSuggestions() {
    const response = await api.get('/orders/pickup-suggestions');
    return response.data;
  }

  async reorder(orderId: string) {
    const response = await api.post('/orders/reorder', { order_id: orderId });
    return response.data;
  }

  // Admin methods
  async getAllOrders(filters?: { status?: string; date?: string; sort_by_priority?: boolean }) {
    const response = await api.get('/orders', { params: filters });
    return response.data;
  }

  async updateOrderStatus(id: string, status: string, notes?: string) {
    const response = await api.patch(`/orders/${id}/status`, { status, notes });
    return response.data;
  }
}

export const orderService = new OrderService();
export default orderService;
