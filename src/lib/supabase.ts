import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please add them to your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper to get auth header for API calls
export const getAuthHeader = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? {
    'Authorization': `Bearer ${session.access_token}`
  } : {};
};

export default supabase;
