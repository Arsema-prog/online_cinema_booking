import type { User } from '@/types';
import { apiClient } from './httpClient';

export const getUsers = (search?: string, page = 0, size = 20) => 
  apiClient.get<{ content: User[]; totalElements: number }>('/api/v1/support/users', {
    params: { search, page, size },
  });

export const getUser = (userId: string) => 
  apiClient.get<User>(`/api/v1/support/users/${userId}`);

export const updateUser = (userId: string, data: Partial<Omit<User, 'id' | 'username' | 'createdTimestamp' | 'roles'>>) => 
  apiClient.put<User>(`/api/v1/support/users/${userId}`, data);

export const deleteUser = (userId: string) => 
  apiClient.delete(`/api/v1/support/users/${userId}`);

export const resetPassword = (userId: string, newPassword: string) => 
  apiClient.put(`/api/v1/support/users/${userId}/reset-password`, { newPassword });

export const assignRoles = (userId: string, roles: string[]) => 
  apiClient.post(`/api/v1/support/users/${userId}/roles`, roles);

export const removeRoles = (userId: string, roles: string[]) => 
  apiClient.delete(`/api/v1/support/users/${userId}/roles`, { data: roles });

export const registerUser = (data: { username: string; email: string; firstName: string; lastName: string; password: string; roles: string[] }) => 
  apiClient.post(`/api/v1/support/auth/register`, data);
