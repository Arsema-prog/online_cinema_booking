// hooks/useBooking.ts
import { useState, useEffect, useCallback } from "react";
import { 
  getScreeningSeats, 
  holdSeats, 
  confirmBooking, 
  cancelBooking,
  ScreeningSeat,
  HoldResponse 
} from "../api/bookingApi";

export const useBooking = (screeningId: number, showId: string) => {
  const [seats, setSeats] = useState<ScreeningSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<ScreeningSeat[]>([]);
  const [holdResponse, setHoldResponse] = useState<HoldResponse | null>(null);
  const [holdingSeats, setHoldingSeats] = useState(false);

  // Load seats from core-service
  // In useBooking.ts, update the loadSeats function
useEffect(() => {
  const loadSeats = async () => {
    try {
      setLoading(true);
      const data = await getScreeningSeats(screeningId);
      console.log('Raw seat data from API:', data);
      
      // Log unique statuses found
      const statuses = [...new Set(data.map(seat => seat.status))];
      console.log('Unique statuses in data:', statuses);
      
      // Log sample of non-available seats
      const nonAvailable = data.filter(seat => seat.status !== 'AVAILABLE');
      console.log('Non-available seats:', nonAvailable);
      
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

  // Refresh seats function - expose this
  const refreshSeats = useCallback(async () => {
    try {
      const data = await getScreeningSeats(screeningId);
      setSeats(data);
      return data;
    } catch (err) {
      console.error('Failed to refresh seats', err);
      throw err;
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

  // Hold seats using booking-service
 
const holdSelectedSeats = useCallback(async () => {
  if (selectedSeats.length === 0) return;
  
  setHoldingSeats(true);
  try {
    const seatUuids = selectedSeats.map(s => generateUuidFromId(s.seat.id));
    
    console.log('Holding seats with UUIDs:', seatUuids);
    console.log('For show:', showId);
    
    const response = await holdSeats(showId, seatUuids);
    console.log('Hold response received:', response);
    
    setHoldResponse(response);
    
    // Update local seat status to HELD
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
    
    if (err.response?.status === 409 || err.response?.data?.includes('duplicate') || err.response?.data?.includes('already exists')) {
      alert('Some seats are no longer available. Refreshing seat map...');
      await refreshSeats();
      setSelectedSeats([]);
    } else {
      setError(err.response?.data?.message || "Failed to hold seats");
    }
    throw err;
  } finally {
    setHoldingSeats(false);
  }
}, [showId, selectedSeats, refreshSeats]);
  // Confirm booking

const confirmSelectedBooking = useCallback(async () => {
  if (!holdResponse) {
    throw new Error("No hold found");
  }

  console.log('Confirming booking with ID:', holdResponse.bookingId);

  try {
    // Get user email from your auth context
    const userEmail = "arsematesfaye019@gmail.com"; // Replace with actual user email
    
    console.log('Calling confirmBooking API...');
    await confirmBooking(holdResponse.bookingId, userEmail);
    console.log('ConfirmBooking API call successful');
    
    // Update local seat status to RESERVED
    setSeats(prev => 
      prev.map(seat => {
        if (selectedSeats.some(s => s.id === seat.id)) {
          return { ...seat, status: 'RESERVED' as const };
        }
        return seat;
      })
    );
    
    // Clear selections and hold response
    setSelectedSeats([]);
    setHoldResponse(null);
    
    // Refresh seats after confirmation
    await refreshSeats();
    console.log('Seats refreshed after confirmation');
    
  } catch (err: any) {
    console.error('Confirm error:', err.response?.data || err.message);
    setError(err.response?.data?.message || "Failed to confirm booking");
    throw err;
  }
}, [holdResponse, selectedSeats, refreshSeats]);
// Cancel hold
  const cancelHold = useCallback(async () => {
    if (!holdResponse) return;

    try {
      await cancelBooking(holdResponse.bookingId);
      
      // Update local seat status back to AVAILABLE
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
      
      // Refresh seats after cancel
      await refreshSeats();
      
    } catch (err: any) {
      console.error('Cancel error:', err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to cancel hold");
      throw err;
    }
  }, [holdResponse, selectedSeats, refreshSeats]);

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
    confirmSelectedBooking,
    cancelHold,
    clearSelections,
    refreshSeats,  // Now exposed!
    totalAmount,
    holdingSeats,
    hasSelectedSeats: selectedSeats.length > 0,
    holdResponse
  };
};

// Helper function to generate a consistent UUID from a numeric ID
function generateUuidFromId(id: number): string {
  const paddedId = id.toString().padStart(12, '0');
  return `00000000-0000-0000-0000-${paddedId}`;
}