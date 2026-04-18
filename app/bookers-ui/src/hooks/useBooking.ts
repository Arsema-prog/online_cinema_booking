// hooks/useBooking.ts
import { useState, useEffect, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getAccessTokenGetter } from "../httpClient";
import { 
  getScreeningSeats, 
  getSeatUuidMapping,
  getBookingSeatAvailability,
  holdSeats, 
  confirmBooking, 
  cancelBooking,
  ScreeningSeat,
  HoldResponse 
} from "../api/bookingApi";
import { env } from "../env";

/** API returns JSON object keys as strings; normalize for numeric core seat id lookups. */
function normalizeSeatUuidMapping(raw: Record<string, string> | Record<number, string>): Record<number, string> {
  const out: Record<number, string> = {};
  for (const [k, v] of Object.entries(raw ?? {})) {
    const num = Number(k);
    if (!Number.isNaN(num) && typeof v === "string" && v.length > 0) {
      out[num] = v;
    }
  }
  return out;
}

export const useBooking = (screeningId: number) => {
  const [seats, setSeats] = useState<ScreeningSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<ScreeningSeat[]>([]);
  const [holdResponse, setHoldResponse] = useState<HoldResponse | null>(null);
  const [holdingSeats, setHoldingSeats] = useState(false);
  const [seatUuidMap, setSeatUuidMap] = useState<Record<number, string>>({});
  const [showId, setShowId] = useState<string>('');
  const [liveUpdatesConnected, setLiveUpdatesConnected] = useState(false);

  const normalizeStatus = (status: string): ScreeningSeat['status'] => {
    const normalized = status?.toUpperCase();
    if (normalized === 'BOOKED') return 'RESERVED';
    if (normalized === 'HELD') return 'HELD';
    if (normalized === 'RESERVED') return 'RESERVED';
    if (normalized === 'CANCELLED') return 'CANCELLED';
    return 'AVAILABLE';
  };

  const getErrorMessage = (err: any, fallback: string) => {
    const status = err?.status ?? err?.response?.status;
    if (status === 401) {
      return "Your session expired. Please sign in again to continue booking.";
    }
    return err?.normalizedMessage || err?.response?.data?.message || err?.message || fallback;
  };

  const applySeatSnapshot = useCallback((nextSeats: ScreeningSeat[]) => {
    setSeats(nextSeats);
    setSelectedSeats((prev) =>
      prev
        .map((selected) =>
          nextSeats.find(
            (seat) => seat.id === selected.id && seat.status === 'AVAILABLE'
          )
        )
        .filter((seat): seat is ScreeningSeat => Boolean(seat))
    );
  }, []);

  const mergeSeatStatuses = useCallback(
    async (
      screeningSeats: ScreeningSeat[],
      uuidMapping: Record<number, string>,
      currentShowId: string
    ): Promise<ScreeningSeat[]> => {
      try {
        const availability = await getBookingSeatAvailability(currentShowId);
        const statusByUuid = new Map(
          availability.map(item => [item.seatId, normalizeStatus(item.status)])
        );

        return screeningSeats.map(seat => {
          const seatUuid = uuidMapping[seat.seat.id];
          if (!seatUuid) return seat;

          const bookingStatus = statusByUuid.get(seatUuid);
          if (!bookingStatus) return seat;

          return { ...seat, status: bookingStatus };
        });
      } catch (err) {
        console.warn('Failed to merge booking-service seat statuses, using core-service statuses only.', err);
        return screeningSeats;
      }
    },
    []
  );

  // Load seats and UUID mapping
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [seatsData, uuidMappingRaw] = await Promise.all([
          getScreeningSeats(screeningId),
          getSeatUuidMapping(screeningId)
        ]);

        const uuidMapping = normalizeSeatUuidMapping(uuidMappingRaw);
        
        console.log('Seats loaded:', seatsData.length);
        console.log('UUID mapping loaded:', Object.keys(uuidMapping).length);
        
        const paddedId = screeningId.toString().padStart(12, '0');
        const generatedShowId = `00000000-0000-0000-0000-${paddedId}`;
        const mergedSeats = await mergeSeatStatuses(seatsData, uuidMapping, generatedShowId);

        applySeatSnapshot(mergedSeats);
        setSeatUuidMap(uuidMapping);
        setShowId(generatedShowId);
        
      } catch (err) {
        console.error('Failed to load seat data:', err);
        setError(getErrorMessage(err, "Failed to load seat data. Please refresh the page."));
      } finally {
        setLoading(false);
      }
    };

    if (screeningId) {
      loadData();
    }
  }, [screeningId]);

  useEffect(() => {
    if (!showId || Object.keys(seatUuidMap).length === 0) {
      return;
    }

    const token = getAccessTokenGetter()();
    const wsBase = env.apiGatewayUrl || "http://localhost:8090";
    const client = new Client({
      webSocketFactory: () => new SockJS(`${wsBase}/api/v1/booking/ws-booking`),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 4000
    });

    client.onConnect = () => {
      setLiveUpdatesConnected(true);
      client.subscribe(`/topic/shows/${showId}/seats`, (message) => {
        try {
          const payload = JSON.parse(message.body) as { seatId: string; status: string };
          if (!payload?.seatId || !payload?.status) return;
          const mappedStatus = normalizeStatus(payload.status);
          setSeats((prev) =>
            prev.map((seat) =>
              seatUuidMap[seat.seat.id] === payload.seatId
                ? { ...seat, status: mappedStatus }
                : seat
            )
          );

          if (mappedStatus !== 'AVAILABLE') {
            setSelectedSeats((prev) =>
              prev.filter((seat) => seatUuidMap[seat.seat.id] !== payload.seatId)
            );
          }
        } catch (e) {
          console.warn("Failed to parse seat websocket payload", e);
        }
      });
    };

    client.onStompError = () => {
      setLiveUpdatesConnected(false);
    };

    client.onWebSocketClose = () => {
      setLiveUpdatesConnected(false);
    };

    client.onWebSocketError = () => {
      setLiveUpdatesConnected(false);
    };

    client.activate();
    return () => {
      setLiveUpdatesConnected(false);
      client.deactivate();
    };
  }, [showId, seatUuidMap]);

  const refreshSeats = useCallback(async () => {
    try {
      const data = await getScreeningSeats(screeningId);
      if (!showId || Object.keys(seatUuidMap).length === 0) {
        applySeatSnapshot(data);
        return data;
      }

      const merged = await mergeSeatStatuses(data, seatUuidMap, showId);
      applySeatSnapshot(merged);
      return merged;
    } catch (err) {
      console.error('Failed to refresh seats', err);
      throw err;
    }
  }, [applySeatSnapshot, screeningId, seatUuidMap, showId, mergeSeatStatuses]);

  const toggleSeat = useCallback((seat: ScreeningSeat) => {
    const isSelected = selectedSeats.some((selected) => selected.id === seat.id);
    if (!isSelected && seat.status !== 'AVAILABLE') {
      setError('That seat is no longer available. Please choose another seat.');
      return;
    }

    if (!isSelected && selectedSeats.length >= 8) {
      setError('You can select up to 8 seats in a single booking.');
      return;
    }

    setError(null);

    setSelectedSeats(prev => {
      const alreadySelected = prev.some(s => s.id === seat.id);
      if (alreadySelected) {
        return prev.filter(s => s.id !== seat.id);
      } else {
        return [...prev, seat];
      }
    });
  }, [selectedSeats]);

  const holdSelectedSeats = useCallback(async () => {
    if (selectedSeats.length === 0) {
      setError("Please select at least one seat");
      return;
    }
    
    setHoldingSeats(true);
    setError(null);
    
    try {
      const coreSeatIds = selectedSeats.map(s => s.seat.id);
      const seatUuids = coreSeatIds.map(id => seatUuidMap[id]);
      
      const missingUuids = coreSeatIds.filter((id, index) => !seatUuids[index]);
      if (missingUuids.length > 0) {
        console.error('Missing UUID for seats:', missingUuids);
        setError('Seat mapping error. Please refresh the page.');
        setHoldingSeats(false);
        return;
      }
      
      console.log('Holding seats:', coreSeatIds);
      console.log('With UUIDs:', seatUuids);
      console.log('For show:', showId);
      
      const response = await holdSeats(showId, seatUuids);
      console.log('Hold successful:', response);
      
      setHoldResponse(response);
      
      setSeats(prev => 
        prev.map(seat => {
          if (selectedSeats.some(s => s.id === seat.id)) {
            return { ...seat, status: 'HELD' as const };
          }
          return seat;
        })
      );
      
      return response;
    } catch (err: any) {
      console.error('Hold error:', err.response?.data || err.message);
      
      if (err.response?.status === 409) {
        setError('Some seats are no longer available. Refreshing seat map...');
        await refreshSeats();
        setSelectedSeats([]);
      } else {
        setError(getErrorMessage(err, "Failed to hold seats. Please try again."));
      }
      throw err;
    } finally {
      setHoldingSeats(false);
    }
  }, [showId, selectedSeats, seatUuidMap, refreshSeats]);

  const confirmSelectedBooking = useCallback(async () => {
    if (!holdResponse) {
      setError("No active hold found");
      return;
    }

    setHoldingSeats(true);
    
    try {
      let userEmail = "";
      try {
        const token = getAccessTokenGetter()();
        if (token) {
          const payload = token.split(".")[1];
          if (payload) {
            const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
            const tokenEmail = decoded?.email;
            if (typeof tokenEmail === "string" && tokenEmail.includes("@")) {
              userEmail = tokenEmail;
            }
          }
        }
      } catch {}

      try {
        const cached = localStorage.getItem("bookers_user_email");
        if (!userEmail && cached && cached.includes("@")) {
          userEmail = cached;
        }
      } catch {}

      await confirmBooking(holdResponse.bookingId, userEmail || undefined);
      
      setSeats(prev => 
        prev.map(seat => {
          if (selectedSeats.some(s => s.id === seat.id)) {
            return { ...seat, status: 'RESERVED' as const };
          }
          return seat;
        })
      );
      
      setSelectedSeats([]);
      setHoldResponse(null);
      await refreshSeats();
      
    } catch (err: any) {
      console.error('Confirm error:', err.response?.data || err.message);
      setError(getErrorMessage(err, "Failed to confirm booking"));
      throw err;
    } finally {
      setHoldingSeats(false);
    }
  }, [holdResponse, selectedSeats, refreshSeats]);

  const cancelHold = useCallback(async () => {
    if (!holdResponse) return;

    setHoldingSeats(true);
    
    try {
      await cancelBooking(holdResponse.bookingId);
      
      setSeats(prev => 
        prev.map(seat => {
          if (selectedSeats.some(s => s.id === seat.id)) {
            return { ...seat, status: 'AVAILABLE' as const };
          }
          return seat;
        })
      );
      
      setSelectedSeats([]);
      setHoldResponse(null);
      await refreshSeats();
      
    } catch (err: any) {
      console.error('Cancel error:', err.response?.data || err.message);
      setError(getErrorMessage(err, "Failed to cancel hold"));
      throw err;
    } finally {
      setHoldingSeats(false);
    }
  }, [holdResponse, selectedSeats, refreshSeats]);

  const clearSelections = useCallback(() => {
    setSelectedSeats([]);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!holdResponse?.bookingId) return;
      const cancelUrl = `${env.apiGatewayUrl || "http://localhost:8090"}/api/v1/booking/bookings/${holdResponse.bookingId}/cancel`;
      const token = getAccessTokenGetter()();
      fetch(cancelUrl, {
        method: "POST",
        keepalive: true,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      }).catch(() => {
        // Hold expiry in booking-service is still the final fallback if unload cancellation fails.
      });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [holdResponse]);

  const totalAmount = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  return {
    seats,
    loading,
    error,
    selectedSeats,
    toggleSeat,
    holdSelectedSeats,
    confirmSelectedBooking,
    cancelHold,
    clearSelections,
    refreshSeats,
    totalAmount,
    holdingSeats,
    hasSelectedSeats: selectedSeats.length > 0,
    holdResponse,
    liveUpdatesConnected,
    showId
  };
};
