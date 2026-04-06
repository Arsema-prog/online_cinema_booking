// hooks/useBooking.ts
import { useState, useEffect, useCallback } from "react";
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

export const useBooking = (screeningId: number) => {
  const [seats, setSeats] = useState<ScreeningSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<ScreeningSeat[]>([]);
  const [holdResponse, setHoldResponse] = useState<HoldResponse | null>(null);
  const [holdingSeats, setHoldingSeats] = useState(false);
  const [seatUuidMap, setSeatUuidMap] = useState<Record<number, string>>({});
  const [showId, setShowId] = useState<string>('');

  const normalizeStatus = (status: string): ScreeningSeat['status'] => {
    const normalized = status?.toUpperCase();
    if (normalized === 'HELD') return 'HELD';
    if (normalized === 'RESERVED') return 'RESERVED';
    if (normalized === 'CANCELLED') return 'CANCELLED';
    return 'AVAILABLE';
  };

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
        
        const [seatsData, uuidMapping] = await Promise.all([
          getScreeningSeats(screeningId),
          getSeatUuidMapping(screeningId)
        ]);
        
        console.log('Seats loaded:', seatsData.length);
        console.log('UUID mapping loaded:', Object.keys(uuidMapping).length);
        
        const paddedId = screeningId.toString().padStart(12, '0');
        const generatedShowId = `00000000-0000-0000-0000-${paddedId}`;
        const mergedSeats = await mergeSeatStatuses(seatsData, uuidMapping, generatedShowId);

        setSeats(mergedSeats);
        setSeatUuidMap(uuidMapping);
        setShowId(generatedShowId);
        
      } catch (err) {
        console.error('Failed to load seat data:', err);
        setError("Failed to load seat data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    if (screeningId) {
      loadData();
    }
  }, [screeningId]);

  const refreshSeats = useCallback(async () => {
    try {
      const data = await getScreeningSeats(screeningId);
      if (!showId || Object.keys(seatUuidMap).length === 0) {
        setSeats(data);
        return data;
      }

      const merged = await mergeSeatStatuses(data, seatUuidMap, showId);
      setSeats(merged);
      return merged;
    } catch (err) {
      console.error('Failed to refresh seats', err);
      throw err;
    }
  }, [screeningId, seatUuidMap, showId, mergeSeatStatuses]);

  const toggleSeat = useCallback((seat: ScreeningSeat) => {
    if (seat.status !== 'AVAILABLE') return;
    setSelectedSeats(prev => {
      const isSelected = prev.some(s => s.id === seat.id);
      if (isSelected) {
        return prev.filter(s => s.id !== seat.id);
      } else {
        return [...prev, seat];
      }
    });
  }, []);

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
        setError(err.response?.data?.message || "Failed to hold seats. Please try again.");
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
      setError(err.response?.data?.message || "Failed to confirm booking");
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
      setError(err.response?.data?.message || "Failed to cancel hold");
      throw err;
    } finally {
      setHoldingSeats(false);
    }
  }, [holdResponse, selectedSeats, refreshSeats]);

  const clearSelections = useCallback(() => {
    setSelectedSeats([]);
  }, []);

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
    holdResponse
  };
};
