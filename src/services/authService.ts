import api from '../lib/api';
import { supabase } from '../lib/supabase';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  role?: 'student' | 'admin';
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  role: 'student' | 'admin';
}

class AuthService {
  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    return response.data;
  }

  async login(credentials: LoginCredentials) {
    const response = await api.post('/auth/login', credentials);
    
    // Store session in Supabase client
    if (response.data.session) {
      await supabase.auth.setSession(response.data.session);
    }
    
    return response.data;
  }

  async logout() {
    await supabase.auth.signOut();
    const response = await api.post('/auth/logout');
    return response.data;
  }

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  }

  async updateProfile(updates: Partial<UserProfile>) {
    const response = await api.put('/auth/profile', updates);
    return response.data;
  }

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }
}

export const authService = new AuthService();
export default authService;
