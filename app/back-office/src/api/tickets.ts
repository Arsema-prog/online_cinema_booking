import { apiClient } from './httpClient';

export interface Ticket {
  id: string;
  ticketNumber: string;
  bookingId: number;
  userId: number;
  movieTitle: string;
  branchName: string;
  screenName: string;
  showTime: string;
  seatNumber: string;
  price: number;
  qrObjectKey?: string;
  pdfObjectKey?: string;
  status: 'ACTIVE' | 'USED' | 'CANCELLED';
  issuedAt: string;
  validatedAt?: string;
}

export const getTicketDetails = (ticketId: string): Promise<Ticket> =>
  apiClient.get<Ticket>(`/api/v1/support/tickets/${ticketId}/details`);

export const validateTicket = (ticketId: string): Promise<Ticket> =>
  apiClient.post<Ticket>(`/api/v1/support/tickets/${ticketId}/validate`);

export const getTicketsByBooking = (bookingId: number): Promise<Ticket[]> =>
  apiClient.get<Ticket[]>(`/api/v1/support/bookings/${bookingId}/tickets`);

export const getTicketsByUser = (userId: number): Promise<Ticket[]> =>
  apiClient.get<Ticket[]>(`/api/v1/support/tickets/user/${userId}`);