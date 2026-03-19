// api/bookingApi.ts
import axios from "axios";
import { env } from "../env";

// Export the ScreeningSeat interface
export interface ScreeningSeat {
  id: number;
  status: 'AVAILABLE' | 'HELD' | 'RESERVED' | 'CANCELLED';
  price: number;
  seat: {
    id: number;
    seatNumber: string;
    rowLabel: string;
    isAvailable: boolean;
  };
}

export interface HoldRequest {
  userId: string;
  showId: string;
  seatIds: string[];
}

export interface HoldResponse {
  bookingId: string;  
  status: string;
  heldSeatIds: string[];
  expiresAt: string;
}

// Export this function
export const getScreeningSeats = async (screeningId: number): Promise<ScreeningSeat[]> => {
  const response = await axios.get(`${env.coreServiceUrl}/screening-seats/screening/${screeningId}`);
  return response.data;
};

// api/bookingApi.ts - updated holdSeats function
export const holdSeats = async (showId: string, seatIds: string[]): Promise<HoldResponse> => {
  // Get user ID from auth context - replace with actual user ID from your auth system
  const userId = "123e4567-e89b-12d3-a456-426614174000"; // Example UUID
  
  const request: HoldRequest = {
    userId: userId,
    showId: showId,
    seatIds: seatIds
  };
  
  console.log('Sending hold request:', JSON.stringify(request, null, 2));
  
  try {
    const response = await axios.post(
      `${env.bookingServiceUrl}/bookings/hold`,
      request,
      { 
        headers: { 
          'Content-Type': 'application/json'
        } 
      }
    );
    console.log('Hold response:', response.data);
    return response.data; // This now matches the HoldResponse interface
  } catch (error: any) {
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};


export const confirmBooking = async (bookingId: string, userEmail: string): Promise<void> => {
  if (!bookingId) {
    throw new Error("Booking ID is required");
  }
  console.log('Confirming booking with ID:', bookingId, 'for user:', userEmail);
  await axios.post(`${env.bookingServiceUrl}/bookings/${bookingId}/confirm`, { userEmail });
};

// api/bookingApi.ts
export const cancelBooking = async (bookingId: string): Promise<void> => {
  if (!bookingId) {
    throw new Error("Booking ID is required");
  }
  console.log('Cancelling booking with ID:', bookingId);
  await axios.post(`${env.bookingServiceUrl}/bookings/${bookingId}/cancel`);
};

export const getAvailableSeats = async (showId: string): Promise<any[]> => {
  const response = await axios.get(`${env.bookingServiceUrl}/bookings/shows/${showId}/seats`);
  return response.data;
};