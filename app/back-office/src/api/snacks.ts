import type { Snack } from '@/types';
import { apiClient } from './httpClient';

export const getSnacks = () => apiClient.get<Snack[]>('/api/v1/core/snacks');
export const getSnack = (id: number) => apiClient.get<Snack>(`/api/v1/core/snacks/${id}`);
export const createSnack = (data: Omit<Snack, 'id'>) => apiClient.post<Snack>('/api/v1/core/snacks', data);
export const updateSnack = (id: number, data: Omit<Snack, 'id'>) => apiClient.put<Snack>(`/api/v1/core/snacks/${id}`, data);
export const deleteSnack = (id: number) => apiClient.delete(`/api/v1/core/snacks/${id}`);

export const uploadSnackImage = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'snacks');
  return apiClient.post<{url: string}>('/api/v1/support/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
