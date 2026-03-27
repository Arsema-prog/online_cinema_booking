import type { Screening } from '@/types';
import { apiClient } from './httpClient';

export const getScreenings = () => apiClient.get<Screening[]>('/api/v1/core/screenings');
export const getScreening = (id: number) => apiClient.get<Screening>(`/api/v1/core/screenings/${id}`);
export const createScreening = (data: Omit<Screening, 'id' | 'screeningSeats'>) => 
  apiClient.post<Screening>('/api/v1/core/screenings', data);
export const updateScreening = (id: number, data: Omit<Screening, 'id' | 'screeningSeats'>) => 
  apiClient.put<Screening>(`/api/v1/core/screenings/${id}`, data);
export const deleteScreening = (id: number) => apiClient.delete(`/api/v1/core/screenings/${id}`);