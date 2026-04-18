// hooks/useScreenings.ts
import { useEffect, useState, useCallback } from "react";
import { getScreenings } from "../api/screeningApi";
import { Screening } from "../types";

const normalizeScreenings = (payload: unknown): Screening[] => {
  if (Array.isArray(payload)) {
    return payload as Screening[];
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.content)) {
      return record.content as Screening[];
    }

    if (Array.isArray(record.data)) {
      return record.data as Screening[];
    }

    if (record.data && typeof record.data === "object") {
      const nestedData = record.data as Record<string, unknown>;
      if (Array.isArray(nestedData.content)) {
        return nestedData.content as Screening[];
      }
    }
  }

  return [];
};

export const useScreenings = () => {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScreenings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getScreenings();
      const normalized = normalizeScreenings(data).filter(
        (screening) =>
          Boolean(screening) &&
          Boolean(screening.movie) &&
          screening.id !== null &&
          screening.id !== undefined
      );

      setScreenings(normalized);
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
