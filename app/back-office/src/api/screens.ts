import type { Screen } from '@/types';
import { apiClient } from './httpClient';

// GET all screens
export const getScreens = () => apiClient.get<Screen[]>('/api/v1/core/screens');

// GET screen by ID
export const getScreen = (id: number) => apiClient.get<Screen>(`/api/v1/core/screens/${id}`);

// CREATE screen (requires numberOfSeats as query param)
export const createScreen = (data: Omit<Screen, 'id'>, numberOfSeats: number) =>
  apiClient.post<Screen>(`/api/v1/core/screens?numberOfSeats=${numberOfSeats}`, data);

// UPDATE screen
export const updateScreen = (id: number, data: Omit<Screen, 'id'>) =>
  apiClient.put<Screen>(`/api/v1/core/screens/${id}`, data);

// DELETE screen
export const deleteScreen = (id: number) => apiClient.delete(`/api/v1/core/screens/${id}`);