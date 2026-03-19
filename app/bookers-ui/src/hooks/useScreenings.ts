// hooks/useScreenings.ts
import { useEffect, useState, useCallback } from "react";
import { getScreenings } from "../api/screeningApi";
import { Screening } from "../types";

export const useScreenings = () => {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScreenings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getScreenings();
      setScreenings(data);
      setError(null);
    } catch (err) {
      setError("Failed to load screenings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScreenings();
  }, [loadScreenings]);

  const refreshScreenings = useCallback(async () => {
    await loadScreenings();
  }, [loadScreenings]);

  return { screenings, loading, error, refreshScreenings };
};