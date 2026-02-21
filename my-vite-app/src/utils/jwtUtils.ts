import { jwtDecode } from 'jwt-decode';

// JWT payload structure based on your backend
interface JwtPayload {
  // Standard claims
  sub?: string; // subject (usually user ID)
  email?: string;
  jti?: string; // JWT ID
  iat?: number; // issued at
  exp: number; // expiration time
  
  // ASP.NET Core standard claims
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'?: string;
  
  // Custom claims from your backend
  firstName?: string;
  lastName?: string;
  
  [key: string]: unknown; // Allow for additional claims
}

/**
 * Decode JWT token and extract user information
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    // Check if token expiration time is less than current time
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
};

/**
 * Get user info from token
 */
export const getUserFromToken = (token: string) => {
  const decoded = decodeToken(token);
  if (!decoded) {
    return null;
  }

  // Extract user ID from different possible claim names
  const userId = 
    decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
    decoded.sub ||
    '';

  // Extract email from different possible claim names  
  const email = 
    decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
    decoded.email ||
    decoded.sub ||
    '';

  return {
    userId,
    email,
    firstName: decoded.firstName || '',
    lastName: decoded.lastName || '',
  };
};

/**
 * Validate token and return user info if valid
 */
export const validateToken = (token: string | null) => {
  if (!token) {
    return null;
  }

  if (isTokenExpired(token)) {
    localStorage.removeItem('token');
    return null;
  }

  return getUserFromToken(token);
};
