import api from '../lib/api';

export interface FoodItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  image_url?: string;
  preparation_time: number;
  available: boolean;
  stock_quantity?: number;
  is_special: boolean;
  is_seasonal: boolean;
  is_fasting: boolean;
  is_surplus: boolean;
  discount_percentage: number;
  tags?: string[];
  mood_tags?: string[];
  rating?: number;
  review_count?: number;
}

class FoodService {
  async getFoodItems(filters?: {
    category?: string;
    available?: boolean;
    search?: string;
    mood?: string;
    is_special?: boolean;
    is_seasonal?: boolean;
    is_fasting?: boolean;
  }) {
    const response = await api.get('/food', { params: filters });
    return response.data;
  }

  async getFoodItemById(id: string) {
    const response = await api.get(`/food/${id}`);
    return response.data;
  }

  async getCategories() {
    const response = await api.get('/food/categories');
    return response.data;
  }

  async getBestSelling(limit = 10) {
    const response = await api.get('/food/best-selling', { params: { limit } });
    return response.data;
  }

  async getSurplusFood() {
    const response = await api.get('/food/surplus');
    return response.data;
  }

  // Admin methods
  async createFoodItem(data: Partial<FoodItem>) {
    const response = await api.post('/food', data);
    return response.data;
  }

  async updateFoodItem(id: string, data: Partial<FoodItem>) {
    const response = await api.put(`/food/${id}`, data);
    return response.data;
  }

  async deleteFoodItem(id: string) {
    const response = await api.delete(`/food/${id}`);
    return response.data;
  }
}

export const foodService = new FoodService();
export default foodService;
