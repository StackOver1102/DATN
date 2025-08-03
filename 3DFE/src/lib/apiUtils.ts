import { apiRequest } from './api';
import { User } from './types';

// Create a non-hook version of the API utility for use in Redux thunks
export const apiUtils = {
  getUserProfile: async (token?: string) => {
    return apiRequest<User>('users/profile', 'GET', undefined, token);
  }
};