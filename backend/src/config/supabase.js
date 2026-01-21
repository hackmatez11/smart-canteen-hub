import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please check your .env file.');
}

// Public client (for client-side operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client (for admin operations, bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database helper functions
export const db = {
  // Get user profile by ID
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get all food items
  async getFoodItems(filters = {}) {
    let query = supabase.from('food_items').select('*');
    
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.available !== undefined) {
      query = query.eq('available', filters.available);
    }
    
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get food item by ID
  async getFoodItemById(id) {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create order
  async createOrder(orderData) {
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get orders by user
  async getOrdersByUser(userId) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          food_items (*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get order by ID
  async getOrderById(orderId) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          food_items (*)
        )
      `)
      .eq('id', orderId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update order status
  async updateOrderStatus(orderId, status, updates = {}) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, ...updates })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

export default supabase;
