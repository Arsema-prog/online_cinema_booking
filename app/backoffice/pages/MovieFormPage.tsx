import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BackofficeMoviesApi } from "../api/moviesApi";
import { Movie } from "../../types";

export const MovieFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<Omit<Movie, "id">>({
    title: "",
    genre: "",
    duration: 90
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    BackofficeMoviesApi.get(Number(id))
      .then(movie => {
        setForm({
          title: movie.title,
          genre: movie.genre,
          duration: movie.duration
        });
        setError(null);
      })
      .catch((err: any) => {
        setError(err.normalizedMessage || "Failed to load movie");
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === "duration" ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit && id) {
        await BackofficeMoviesApi.update(Number(id), form);
      } else {
        await BackofficeMoviesApi.create(form);
      }
      navigate("/backoffice/movies");
    } catch (err: any) {
      setError(err.normalizedMessage || "Failed to save movie");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>
        {isEdit ? "Edit movie" : "Add movie"}
      </h1>
      {error && (
        <div style={{ marginBottom: 12, color: "#f97373", fontSize: 14 }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 4, fontSize: 14 }}>
          <span>Title</span>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            style={{
              padding: "6px 8px",
              borderRadius: 4,
              border: "1px solid #4b5563",
              background: "#020617",
              color: "#e5e7eb"
            }}
          />
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 14 }}>
          <span>Genre</span>
          <input
            name="genre"
            value={form.genre}
            onChange={handleChange}
            required
            style={{
              padding: "6px 8px",
              borderRadius: 4,
              border: "1px solid #4b5563",
              background: "#020617",
              color: "#e5e7eb"
            }}
          />
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 14 }}>
          <span>Duration (minutes)</span>
          <input
            type="number"
            name="duration"
            value={form.duration}
            onChange={handleChange}
            min={1}
            required
            style={{
              padding: "6px 8px",
              borderRadius: 4,
              border: "1px solid #4b5563",
              background: "#020617",
              color: "#e5e7eb"
            }}
          />
        </label>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "8px 12px",
              borderRadius: 4,
              border: "none",
              cursor: "pointer",
              background: "#4f46e5",
              color: "white",
              fontSize: 14,
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/backoffice/movies")}
            style={{
              padding: "8px 12px",
              borderRadius: 4,
              border: "1px solid #4b5563",
              background: "transparent",
              color: "#e5e7eb",
              fontSize: 14,
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

