// Authentication Service - Single Responsibility Principle
// Handles all authentication-related operations

import { validateToken, isTokenExpired } from '../utils/jwtUtils';

const TOKEN_KEY = 'token';

/**
 * Authentication Service
 * Following SOLID principles - Single Responsibility
 */
export class AuthenticationService {
  /**
   * Get stored token from localStorage
   */
  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Store token in localStorage
   */
  static setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Remove token from localStorage
   */
  static removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      this.removeToken();
      return false;
    }

    return true;
  }

  /**
   * Get user information from stored token
   */
  static getCurrentUser() {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    return validateToken(token);
  }

  /**
   * Clear all authentication data
   */
  static logout(): void {
    this.removeToken();
    // Clear any other auth-related data if needed
  }

  /**
   * Initialize authentication on app load
   * Returns user info if valid token exists
   */
  static initialize() {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    // Validate token and return user info
    const userInfo = validateToken(token);
    if (!userInfo) {
      this.removeToken();
      return null;
    }

    return {
      user: userInfo,
      token,
      isAuthenticated: true,
    };
  }
}

export default AuthenticationService;
