import type { Movie } from '@/types';
import { apiClient } from './httpClient';

export const getMovies = () => apiClient.get<Movie[]>('/api/v1/core/movies');
export const getMovie = (id: number) => apiClient.get<Movie>(`/api/v1/core/movies/${id}`);
export const createMovie = (data: Omit<Movie, 'id'>) => apiClient.post<Movie>('/api/v1/core/movies', data);
export const updateMovie = (id: number, data: Omit<Movie, 'id'>) => apiClient.put<Movie>(`/api/v1/core/movies/${id}`, data);
export const deleteMovie = (id: number) => apiClient.delete(`/api/v1/core/movies/${id}`);