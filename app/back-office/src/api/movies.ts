import type { Movie, Tag } from '@/types';
import { apiClient } from './httpClient';

export const getMovies = () => apiClient.get<Movie[]>('/api/v1/core/movies');
export const getMovie = (id: number) => apiClient.get<Movie>(`/api/v1/core/movies/${id}`);
export const getTags = () => apiClient.get<Tag[]>('/api/v1/core/tags');
export const createMovie = (data: Omit<Movie, 'id'>, posterFile?: File) => {
  const formData = new FormData();
  formData.append('movie', new Blob([JSON.stringify(data)], { type: 'application/json' }), 'movie.json');
  if (posterFile) formData.append('poster', posterFile);
  // Let browser/axios set multipart boundary automatically.
  return apiClient.post<Movie>('/api/v1/core/movies', formData);
};

export const updateMovie = (id: number, data: Omit<Movie, 'id'>, posterFile?: File) => {
  const formData = new FormData();
  formData.append('movie', new Blob([JSON.stringify(data)], { type: 'application/json' }), 'movie.json');
  if (posterFile) formData.append('poster', posterFile);
  // Let browser/axios set multipart boundary automatically.
  return apiClient.put<Movie>(`/api/v1/core/movies/${id}`, formData);
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

export const searchExternalMovies = (q: string) => apiClient.get<Movie[]>(`/api/v1/core/movies/search?q=${encodeURIComponent(q)}`);
export const getExternalMovieDetails = (id: string) => apiClient.get<Movie>(`/api/v1/core/movies/search/details?id=${encodeURIComponent(id)}`);