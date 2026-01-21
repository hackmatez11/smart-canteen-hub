import { supabase, supabaseAdmin } from '../config/supabase.js';

/**
 * Register a new user
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, full_name, role = 'student' } = req.body;

    // Validate role
    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be either "student" or "admin"'
      });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for development
      user_metadata: {
        full_name,
        role
      }
    });

    if (authError) {
      return res.status(400).json({
        error: authError.message
      });
    }

    // Create user profile in database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        role
      })
      .select()
      .single();

    if (profileError) {
      // Rollback: Delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name,
        role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      message: 'Login successful',
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        ...profile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 */
export const logout = async (req, res, next) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    res.json({
      user: profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { full_name, phone_number, avatar_url } = req.body;

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (phone_number !== undefined) updates.phone_number = phone_number;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Profile updated successfully',
      user: profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh session
 */
export const refreshSession = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      return res.status(401).json({
        error: 'Invalid refresh token'
      });
    }

    res.json({
      session: data.session
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  refreshSession
};
