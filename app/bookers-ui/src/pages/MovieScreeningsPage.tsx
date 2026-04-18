// pages/MovieScreeningsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { apiClient } from "../httpClient";
import { ChevronLeft, Calendar, MapPin, Clock, Film } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
  const location = useLocation();
  const passedTitle = (location.state as any)?.title as string | undefined;
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    apiClient
      .get(`/api/v1/core/screenings/movie/${movieId}`)
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
        let filtered = normalized.filter(Boolean);
        // If caller passed a movie title, ensure we only show screenings matching that title
        if (passedTitle) {
          const titleLower = passedTitle.toLowerCase();
          filtered = filtered.filter(s => (s?.movie?.title || '').toLowerCase() === titleLower);
        }
        setScreenings(filtered);
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
    if (passedTitle) return passedTitle;
    const first = screenings.find(Boolean);
    return first?.movie?.title || "Available Screenings";
  }, [screenings, passedTitle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-booking-gradient pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto animate-fadeIn">
        
        <div className="glass-panel p-4 md:p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8 shadow-lg">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full shrink-0 border-white/10 hover:bg-primary"
          >
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h1 className="font-headline text-3xl font-bold text-white tracking-tight mb-1">{movieTitle}</h1>
            <p className="text-muted-foreground font-medium">Choose a screening time below</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/20 border border-destructive/40 text-destructive font-medium">
            {error}
          </div>
        )}

        {screenings.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-2xl bg-black/40 border border-white/5">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
               <Film size={40} className="text-muted-foreground" />
            </div>
            <h3 className="font-headline text-2xl font-bold text-white mb-2">No Screenings Found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">There are currently no scheduled screenings for this movie. Check back later.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {screenings.map((screening, idx) => {
              const showDate = screening.startTime ? new Date(screening.startTime) : null;
              const branchName = screening.screen?.branch?.name || screening.cinemaName || "Main Cinema";
              const screenName = screening.screen?.name || "Screen";
              const address = screening.screen?.branch?.address || screening.screen?.branch?.city || "Location unavailable";

              return (
                 <button
                  key={String(screening.id ?? idx)}
                  onClick={() => screening.id && navigate(`/bookers/booking/${screening.id}`)}
                  className="group flex flex-col glass-card p-6 md:p-8 rounded-2xl bg-black/40 border border-white/5 hover:border-primary/50 hover:bg-white/5 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 text-left w-full cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
                    <div>
                      <h3 className="font-headline text-xl md:text-2xl font-bold text-white group-hover:text-primary transition-colors mb-2">{branchName}</h3>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                        <MapPin size={16} className="text-primary" /> 
                        <span className="text-white/80">{screenName}</span> • <span className="line-clamp-1">{address}</span>
                      </div>
                    </div>
                    <div className="self-start bg-primary/20 text-primary px-4 py-1.5 rounded-full font-bold tabular-nums border border-primary/30">
                      ${typeof screening.price === "number" ? screening.price.toFixed(2) : "15.00"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-auto">
                    <div className="flex items-center gap-2 bg-secondary text-white/90 px-4 py-2 rounded-xl text-sm font-medium border border-white/5 group-hover:border-primary/30 transition-colors">
                      <Calendar size={18} className="text-primary" />
                      {showDate ? showDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "Date TBD"}
                    </div>
                    <div className="flex items-center gap-2 bg-secondary text-white/90 px-4 py-2 rounded-xl text-sm font-medium border border-white/5 group-hover:border-primary/30 transition-colors">
                      <Clock size={18} className="text-primary" />
                      {showDate ? showDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Time TBD"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
