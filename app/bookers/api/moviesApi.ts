import { coreClient } from "../../httpClient";
import { Movie } from "../../types";

export const BookersMoviesApi = {
  list(): Promise<Movie[]> {
    return coreClient.get<Movie[]>("/movies").then(r => r.data);
  },
  get(id: number): Promise<Movie> {
    return coreClient.get<Movie>(`/movies/${id}`).then(r => r.data);
  }
};

