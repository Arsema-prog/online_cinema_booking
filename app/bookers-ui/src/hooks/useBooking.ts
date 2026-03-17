// hooks/useBooking.ts
import { useState, useEffect, useCallback } from "react";
import { getScreeningSeats, holdSeats, reserveSeats, releaseHold, ScreeningSeat } from "../api/bookingApi";

export const useBooking = (screeningId: number) => {
  const [seats, setSeats] = useState<ScreeningSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<ScreeningSeat[]>([]);
  const [holdingSeats, setHoldingSeats] = useState(false);

  // Load seats
  useEffect(() => {
    const loadSeats = async () => {
      try {
        setLoading(true);
        const data = await getScreeningSeats(screeningId);
        setSeats(data);
      } catch (err) {
        setError("Failed to load seats");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (screeningId) {
      loadSeats();
    }
  }, [screeningId]);

  // Toggle seat selection
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

  // Hold selected seats
  const holdSelectedSeats = useCallback(async () => {
    if (selectedSeats.length === 0) return;
    
    setHoldingSeats(true);
    try {
      const seatIds = selectedSeats.map(s => s.seat.id);
      const heldSeats = await holdSeats(screeningId, seatIds);
      
      // Update seats with new status
      setSeats(prev => 
        prev.map(seat => {
          const heldSeat = heldSeats.find(hs => hs.id === seat.id);
          return heldSeat || seat;
        })
      );
      
      return heldSeats;
    } catch (err) {
      setError("Failed to hold seats");
      throw err;
    } finally {
      setHoldingSeats(false);
    }
  }, [screeningId, selectedSeats]);

  // Confirm booking
  const confirmBooking = useCallback(async () => {
    if (selectedSeats.length === 0) {
      throw new Error("No seats selected");
    }

    try {
      const seatIds = selectedSeats.map(s => s.seat.id);
      const reservedSeats = await reserveSeats(screeningId, seatIds);
      
      // Update seats with new status
      setSeats(prev => 
        prev.map(seat => {
          const reservedSeat = reservedSeats.find(rs => rs.id === seat.id);
          return reservedSeat || seat;
        })
      );
      
      return reservedSeats;
    } catch (err) {
      setError("Failed to reserve seats");
      throw err;
    }
  }, [screeningId, selectedSeats]);

  // Clear all selections
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
    confirmBooking,
    clearSelections,
    totalAmount,
    holdingSeats,
    hasSelectedSeats: selectedSeats.length > 0
  };
};