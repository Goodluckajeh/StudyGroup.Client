import apiClient from '../config/api';

export interface UpdateUserDto {
  firstName: string;
  lastName: string;
  skills?: string;
  bio?: string;
}

export interface UserProfile {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  skills?: string;
  visibility?: boolean;
  bio?: string;
}

const userService = {
  // Get current user profile
  getMyProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get('/users/me');
    return response.data.user;
  },

  // Update current user profile
  updateMyProfile: async (userData: UpdateUserDto): Promise<void> => {
    await apiClient.put('/users/me', userData);
  },
};

export default userService;
