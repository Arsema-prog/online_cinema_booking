import axios from 'axios';
import { getAccessTokenGetter } from '../httpClient';
import { env } from '../env';

export interface ScreeningSeat {
  id: number;
  seat: {
    id: number;
    seatNumber: string;
    rowLabel: string;
  };
  status: 'AVAILABLE' | 'HELD' | 'RESERVED' | 'CANCELLED';
  price: number;
}

export interface HoldResponse {
  bookingId: string;
  status: string;
  heldSeatIds: string[];
  expiresAt: string;
  expiresAtEpochMs?: number;
}

export interface BookingSeatAvailability {
  seatId: string;
  status: string;
}

const resolveUserIdFromToken = (): string => {
  const token = getAccessTokenGetter()();
  if (!token) return "123e4567-e89b-12d3-a456-426614174000";

  try {
    const payload = token.split('.')[1];
    if (!payload) return "123e4567-e89b-12d3-a456-426614174000";
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded?.sub || "123e4567-e89b-12d3-a456-426614174000";
  } catch {
    return "123e4567-e89b-12d3-a456-426614174000";
  }
};

// Get screening seats
export const getScreeningSeats = async (screeningId: number): Promise<ScreeningSeat[]> => {
  const response = await axios.get(`${CORE_BASE_URL}/screening-seats/screening/${screeningId}`);
  return response.data;
};

// Get seat UUID mapping for a screening
export const getSeatUuidMapping = async (screeningId: number): Promise<Record<number, string>> => {
  const response = await axios.get(`${CORE_BASE_URL}/screening-seats/screening/${screeningId}/seat-uuids`);
  return response.data;
};

// Hold seats
export const holdSeats = async (showId: string, seatIds: string[]): Promise<HoldResponse> => {
  const response = await axios.post(`${BOOKING_BASE_URL}/bookings/hold`, {
    showId,
    seatIds,
    userId: resolveUserIdFromToken()
  });
  return response.data;
};

export const getBookingSeatAvailability = async (showId: string): Promise<BookingSeatAvailability[]> => {
  const response = await axios.get(`${BOOKING_BASE_URL}/bookings/shows/${showId}/seats`);
  return response.data;
};

// Confirm booking
export const confirmBooking = async (bookingId: string, userEmail?: string): Promise<void> => {
  const params = userEmail && userEmail.trim() ? { userEmail } : undefined;
  await axios.post(`${BOOKING_BASE_URL}/bookings/${bookingId}/confirm`, null, { params });
};

// Cancel booking
export const cancelBooking = async (bookingId: string): Promise<void> => {
  await axios.post(`${BOOKING_BASE_URL}/bookings/${bookingId}/cancel`);
};
const CORE_BASE_URL =
  env.coreServiceUrl ??
  (env.apiGatewayUrl ? `${env.apiGatewayUrl}/api/v1/core` : 'http://localhost:8081');

const BOOKING_BASE_URL =
  env.bookingServiceUrl ??
  (env.apiGatewayUrl ? `${env.apiGatewayUrl}/api/v1/booking` : 'http://localhost:8082');
