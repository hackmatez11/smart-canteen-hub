import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import authService, { UserProfile } from '../../services/authService';
import { supabase } from '../../lib/supabase';

interface AuthState {
  user: UserProfile | null;
  session: any | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  session: null,
  loading: false,
  error: null,
  isAuthenticated: false
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: { email: string; password: string; full_name: string; role?: 'student' | 'admin' }, { rejectWithValue }) => {
    try {
      const response = await authService.register(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Logout failed');
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getProfile();
      return response.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch profile');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (updates: Partial<UserProfile>, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(updates);
      return response.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update profile');
    }
  }
);

export const checkSession = createAsyncThunk(
  'auth/checkSession',
  async (_, { rejectWithValue }) => {
    try {
      const session = await authService.getSession();
      if (session) {
        const profile = await authService.getProfile();
        return { session, user: profile.user };
      }
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Session check failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setSession: (state, action: PayloadAction<any>) => {
      state.session = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.session = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.session = action.payload.session;
      state.isAuthenticated = true;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Register
    builder.addCase(register.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.session = null;
      state.isAuthenticated = false;
      state.loading = false;
    });

    // Fetch Profile
    builder.addCase(fetchProfile.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
    });
    builder.addCase(fetchProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update Profile
    builder.addCase(updateProfile.fulfilled, (state, action) => {
      state.user = action.payload;
    });

    // Check Session
    builder.addCase(checkSession.fulfilled, (state, action) => {
      if (action.payload) {
        state.session = action.payload.session;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      }
      state.loading = false;
    });
    builder.addCase(checkSession.rejected, (state) => {
      state.loading = false;
      state.isAuthenticated = false;
    });
  }
});

export const { setUser, setSession, clearAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
