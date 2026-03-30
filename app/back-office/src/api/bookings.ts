import { apiClient } from './httpClient';

export interface BookingDTO {
  id: string;
  showId: string;
  userId: string;
  status: string;
  createdDate?: string;
  seatCount?: number;
}

export const getBookings = () => apiClient.get<BookingDTO[]>('/api/v1/booking/bookings');
export const getBookingDTOs = () => apiClient.get<BookingDTO[]>('/api/v1/booking/bookings/dto');
export const getBookingsWithSeatCount = () => apiClient.get<BookingDTO[]>('/api/v1/booking/bookings/with-seat-count');
