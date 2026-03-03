import { useEffect, useState } from "react";
import { BookersMoviesApi } from "../api/moviesApi";
import { Movie } from "../../types";

export const useMovies = () => {
  const [data, setData] = useState<Movie[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    BookersMoviesApi.list()
      .then(movies => {
        if (!active) return;
        setData(movies);
        setError(null);
      })
      .catch((err: any) => {
        if (!active) return;
        setError(err.normalizedMessage || "Failed to load movies");
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
};

