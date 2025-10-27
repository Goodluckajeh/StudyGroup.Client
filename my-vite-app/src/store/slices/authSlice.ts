import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../config/api';

// Types
export interface User {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  skills?: string;
  visibility?: boolean;
  bio?: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  skills?: string;
  visibility?: boolean;
  bio?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.Error || 'Registration failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { Token } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', Token);
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.Error || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
});

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.Token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;
