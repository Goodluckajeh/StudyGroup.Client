// Common TypeScript types and interfaces

export interface ApiError {
  response?: {
    data?: {
      error?: string;
      Error?: string;
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

export interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  topic?: string;
  description?: string;
}

export interface JoinGroupResponse {
  groupMemberId: number;
  groupId: number;
  userId: number;
  statusId: number;
  joinedAt: string;
}

export interface AuthResponse {
  token: string;
  user: {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}