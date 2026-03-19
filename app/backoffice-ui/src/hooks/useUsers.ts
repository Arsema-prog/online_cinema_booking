import { useEffect, useState } from "react";
import { UsersApi } from "../api/usersApi";
import { Page, UserDto } from "../../types";

export const useUsers = () => {
  const [page, setPage] = useState<Page<UserDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = (pageIndex = 0) => {
    setLoading(true);
    UsersApi.list({ search: search || undefined, page: pageIndex, size: 20 })
      .then(result => {
        setPage(result);
        setError(null);
      })
      .catch((err: any) => {
        setError(err.normalizedMessage || "Failed to load users");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return { page, loading, error, setSearch, load };
};

