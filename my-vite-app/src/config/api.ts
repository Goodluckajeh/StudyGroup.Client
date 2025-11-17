import axios from 'axios';

const API_BASE_URL = 'https://localhost:43960/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Don't add token to login/register requests
    const isAuthRequest = config.url?.includes('/auth/login') || 
                          config.url?.includes('/auth/register');
    
    console.log('🔍 Request:', {
      url: config.url,
      method: config.method,
      isAuthRequest,
      hasToken: !!localStorage.getItem('token'),
      headers: config.headers
    });
    
    if (!isAuthRequest) {
      const token = localStorage.getItem('token');
      if (token) {
        // Backend expects just the token without 'Bearer ' prefix
        config.headers.Authorization = token;
        console.log(' Added Authorization header (token only, no Bearer prefix)');
      }
    } else {
      console.log(' Skipping Authorization header for auth request');
    }
    
    return config;
  },
  (error) => {
    console.error(' Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(' Response received:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error(' Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    // Only redirect to login if:
    // 1. We get a 401 error
    // 2. User has a token (meaning they were logged in)
    // 3. It's not a login/register request
    const isAuthRequest = error.config?.url?.includes('/auth/login') || 
                          error.config?.url?.includes('/auth/register');
    
    if (error.response?.status === 401 && !isAuthRequest) {
      const token = localStorage.getItem('token');
      if (token) {
        console.warn(' Token expired or invalid - redirecting to login');
        // Token expired or invalid - redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export { API_BASE_URL };
