import type { Movie } from '@/types';
import { apiClient } from './httpClient';

export const getMovies = () => apiClient.get<Movie[]>('/api/v1/core/movies');
export const getMovie = (id: number) => apiClient.get<Movie>(`/api/v1/core/movies/${id}`);
export const createMovie = (data: Omit<Movie, 'id'>, posterFile?: File) => {
  const formData = new FormData();
  formData.append('movie', new Blob([JSON.stringify(data)], { type: 'application/json' }), 'movie.json');
  if (posterFile) formData.append('poster', posterFile);
  return apiClient.post<Movie>('/api/v1/core/movies', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const updateMovie = (id: number, data: Omit<Movie, 'id'>, posterFile?: File) => {
  const formData = new FormData();
  formData.append('movie', new Blob([JSON.stringify(data)], { type: 'application/json' }), 'movie.json');
  if (posterFile) formData.append('poster', posterFile);
  return apiClient.put<Movie>(`/api/v1/core/movies/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deleteMovie = (id: number) => apiClient.delete(`/api/v1/core/movies/${id}`);

export const uploadImage = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'movies');
  return apiClient.post<{url: string}>('/api/v1/support/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};