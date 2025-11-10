import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../config/api';
import { validateToken, getUserFromToken, isTokenExpired } from '../../utils/jwtUtils';

// Types
export interface User {
  userId: number | string;
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

// Initial state - check for existing token and validate it
const token = localStorage.getItem('token');
const userFromToken = token ? validateToken(token) : null;

const initialState: AuthState = {
  user: userFromToken,
  token: userFromToken ? token : null,
  isAuthenticated: !!userFromToken,
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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { Error?: string } } };
      return rejectWithValue(err.response?.data?.Error || 'Registration failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      
      console.log('Login response:', response.data); // Debug log
      
      // Try both 'Token' (capital T) and 'token' (lowercase t)
      const token = response.data.Token || response.data.token;
      
      // Validate token before storing
      if (!token) {
        console.error('No Token field in response:', response.data);
        console.error('Available fields:', Object.keys(response.data));
        return rejectWithValue('No token received from server');
      }

      console.log('✅ Token received:', token.substring(0, 20) + '...');

      // Check if token is expired
      if (isTokenExpired(token)) {
        return rejectWithValue('Received token is already expired');
      }
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Decode token to get basic user info
      const userInfo = getUserFromToken(token);
      
      console.log('User info from token:', userInfo); // Debug log
      
      // Fetch fresh user profile data from backend
      try {
        const profileResponse = await apiClient.get('/users/me');
        const freshUserData = profileResponse.data.user || profileResponse.data;
        console.log('✅ Fresh user data fetched:', freshUserData);
        
        return {
          token: token,
          user: freshUserData, // Use fresh data from backend instead of token data
          ...response.data,
        };
      } catch (profileError) {
        console.warn('Could not fetch fresh profile, using token data:', profileError);
        // Fallback to token data if profile fetch fails
        return {
          token: token,
          user: userInfo,
          ...response.data,
        };
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      const err = error as { response?: { data?: { Error?: string }; status?: number }; message?: string };
      console.error('Error response:', err.response?.data);
      
      // Handle 401 Unauthorized (incorrect username/password)
      if (err.response?.status === 401) {
        return rejectWithValue('Incorrect username or password');
      }
      
      return rejectWithValue(err.response?.data?.Error || err.message || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
});

// Fetch current user profile from backend
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/users/me');
      return response.data.user || response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { Error?: string }; status?: number }; message?: string };
      return rejectWithValue(err.response?.data?.Error || err.message || 'Failed to fetch user profile');
    }
  }
);

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
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
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
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCredentials, setUser } = authSlice.actions;
export default authSlice.reducer;
