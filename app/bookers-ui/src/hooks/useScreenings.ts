import { useEffect, useState } from "react";
import { getScreenings } from "../api/screeningApi";
import { Screening } from "../types";

export const useScreenings = () => {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadScreenings = async () => {
      try {
        const data = await getScreenings();
        setScreenings(data);
      } catch (err) {
        setError("Failed to load screenings");
      } finally {
        setLoading(false);
      }
    };

    loadScreenings();
  }, []);

  return { screenings, loading, error };
};