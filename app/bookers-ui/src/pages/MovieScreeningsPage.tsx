import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { coreClient } from "../httpClient";
import { ChevronLeft, Calendar, MapPin, Clock, Film } from "lucide-react";

type Screening = {
  id: number | string;
  startTime?: string;
  price?: number;
  movie?: { title?: string } | null;
  screen?: {
    name?: string | null;
    branch?: { name?: string | null; address?: string | null; city?: string | null } | null;
  } | null;
  cinemaName?: string | null;
};

export const MovieScreeningsPage: React.FC = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    coreClient
      .get(`/screenings/${movieId}`)
      .then((res) => {
        if (!active) return;
        const payload = res.data;
        const normalized: Screening[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.content)
            ? payload.content
            : payload
              ? [payload]
              : [];
        setScreenings(normalized.filter(Boolean));
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to fetch movie screenings", err);
        setScreenings([]);
        setError("Failed to load screenings.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [movieId]);

  const movieTitle = useMemo(() => {
    const first = screenings.find(Boolean);
    return first?.movie?.title || "Available Screenings";
  }, [screenings]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
        <p>Loading screenings...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", padding: "40px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "#1e293b",
              border: "none",
              color: "white",
              width: 40,
              height: 40,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 style={{ margin: 0, color: "white", fontSize: 28 }}>{movieTitle}</h1>
            <p style={{ margin: "6px 0 0 0", color: "#94a3b8" }}>Choose a screening time</p>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "rgba(127, 29, 29, 0.35)", border: "1px solid rgba(239,68,68,0.45)", color: "#fecaca" }}>
            {error}
          </div>
        )}

        {screenings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", background: "#1e293b", borderRadius: 16 }}>
            <Film size={48} style={{ color: "#94a3b8", marginBottom: 16 }} />
            <h3 style={{ color: "white", margin: "0 0 8px 0" }}>No Screenings Found</h3>
            <p style={{ color: "#94a3b8", margin: 0 }}>There are currently no scheduled screenings for this movie.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {screenings.map((screening, idx) => {
              const showDate = screening.startTime ? new Date(screening.startTime) : null;
              const branchName = screening.screen?.branch?.name || screening.cinemaName || "Main Cinema";
              const screenName = screening.screen?.name || "Screen";
              const address = screening.screen?.branch?.address || screening.screen?.branch?.city || "Location unavailable";

              return (
                <div
                  key={String(screening.id ?? idx)}
                  onClick={() => screening.id && navigate(`/bookers/booking/${screening.id}`)}
                  style={{
                    padding: "24px",
                    background: "linear-gradient(145deg, #1e293b, #0f172a)",
                    borderRadius: "16px",
                    border: "1px solid rgba(139, 92, 246, 0.2)",
                    cursor: screening.id ? "pointer" : "default",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ margin: "0 0 8px 0", color: "white", fontSize: 20 }}>{branchName}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: 14 }}>
                        <MapPin size={14} /> {screenName} • {address}
                      </div>
                    </div>
                    <div style={{ background: "rgba(139, 92, 246, 0.2)", color: "#a78bfa", padding: "6px 12px", borderRadius: 20, fontWeight: "bold" }}>
                      ${typeof screening.price === "number" ? screening.price.toFixed(2) : "15.00"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#e2e8f0", backgroundColor: "rgba(51, 65, 85, 0.5)", padding: "8px 16px", borderRadius: 8 }}>
                      <Calendar size={16} style={{ color: "#8b5cf6" }} />
                      {showDate ? showDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "Date TBD"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#e2e8f0", backgroundColor: "rgba(51, 65, 85, 0.5)", padding: "8px 16px", borderRadius: 8 }}>
                      <Clock size={16} style={{ color: "#8b5cf6" }} />
                      {showDate ? showDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Time TBD"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
