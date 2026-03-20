import { Movie } from "../types";

const API_URL = "http://localhost:8081";

export async function fetchMovies(): Promise<Movie[]> {
  const response = await fetch(`${API_URL}/movies`);

  if (!response.ok) {
    throw new Error("Failed to fetch movies");
  }

  return response.json();
}

export async function fetchMovieById(id: number): Promise<Movie> {
  const response = await fetch(`${API_URL}/movies/${id}`);

  if (!response.ok) {
    throw new Error("Movie not found");
  }

  return response.json();
}