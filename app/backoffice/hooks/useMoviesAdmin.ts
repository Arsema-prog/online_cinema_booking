import { useEffect, useState } from "react";
import { BackofficeMoviesApi } from "../api/moviesApi";
import { Movie } from "../../types";

export const useMoviesAdmin = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    BackofficeMoviesApi.list()
      .then(result => {
        setMovies(result);
        setError(null);
      })
      .catch((err: any) => {
        setError(err.normalizedMessage || "Failed to load movies");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const remove = async (id: number) => {
    await BackofficeMoviesApi.remove(id);
    reload();
  };

  return { movies, loading, error, reload, remove };
};

