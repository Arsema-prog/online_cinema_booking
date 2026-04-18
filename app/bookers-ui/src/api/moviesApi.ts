import { Movie } from "../types";
import { env } from "../env";

const API_URL = env.apiGatewayUrl ? `${env.apiGatewayUrl}/api/v1/core` : "http://localhost:8090/api/v1/core";

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
