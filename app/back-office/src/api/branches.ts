// src/api/branches.ts
import type { Branch } from '@/types';
import { apiClient } from './httpClient';

export const getBranches = () => apiClient.get<Branch[]>('/api/v1/core/branches');
export const getBranch = (id: number) => apiClient.get<Branch>(`/api/v1/core/branches/${id}`);
export const createBranch = (data: Omit<Branch, 'id'>) => apiClient.post<Branch>('/api/v1/core/branches', data);
export const updateBranch = (id: number, data: Omit<Branch, 'id'>) => apiClient.put<Branch>(`/api/v1/core/branches/${id}`, data);
export const deleteBranch = (id: number) => apiClient.delete(`/api/v1/core/branches/${id}`);