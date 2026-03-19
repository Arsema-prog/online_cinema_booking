import { coreClient } from "../../httpClient";
import { Movie } from "../../types";

export const BackofficeMoviesApi = {
  list(): Promise<Movie[]> {
    return coreClient.get<Movie[]>("/movies").then(r => r.data);
  },
  get(id: number): Promise<Movie> {
    return coreClient.get<Movie>(`/movies/${id}`).then(r => r.data);
  },
  create(payload: Omit<Movie, "id">): Promise<Movie> {
    return coreClient.post<Movie>("/movies", payload).then(r => r.data);
  },
  update(id: number, payload: Omit<Movie, "id">): Promise<Movie> {
    return coreClient.put<Movie>(`/movies/${id}`, payload).then(r => r.data);
  },
  remove(id: number): Promise<void> {
    return coreClient.delete(`/movies/${id}`).then(() => {});
  }
};

