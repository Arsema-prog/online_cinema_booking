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

export interface TicketValidationResponse {
  status: 'SUCCESS' | 'FAILED' | 'ERROR';
  message: string;
  ticket?: Ticket;
}

export interface TicketValidationSuccessResponse {
  status: 'SUCCESS' | 'FAILED' | 'ERROR';
  message: string;
  ticket?: Ticket;
}

export const getTicketDetails = (ticketId: string): Promise<Ticket> =>
  apiClient.get<Ticket>(`/api/v1/support/tickets/${ticketId}/details`).then(res => res.data);

export const validateTicket = (ticketId: string): Promise<TicketValidationSuccessResponse> =>
  apiClient
    .post<TicketValidationSuccessResponse>(`/api/v1/support/tickets/${ticketId}/validate`)
    .then(res => res.data);

export const validateTicketByQrValue = (qrValue: string): Promise<TicketValidationResponse> =>
  apiClient
    .post<TicketValidationResponse>(`/api/v1/support/tickets/validate`, { qrValue })
    .then(res => res.data);

export const scanTicketFromFile = async (
  formData: FormData
): Promise<{ ticketId: string; status: Ticket['status']; message?: string }> => {
  console.log('api/tickets: scanTicketFromFile request to /api/v1/support/tickets/scan-from-file');
  try {
    const response = await apiClient.post<{ ticketId: string; status: Ticket['status']; message?: string }>(
      `/api/v1/support/tickets/scan-from-file`,
      formData,
      {
        headers: {
          Accept: 'application/json',
        },
        timeout: 30000,
      }
    );
    console.log('api/tickets: scanTicketFromFile response', response.data);
    return response.data;
  } catch (error) {
    const status = typeof error === 'object' && error !== null ? (error as any)?.response?.status : undefined;
    const url = typeof error === 'object' && error !== null ? (error as any)?.response?.config?.url : undefined;
    const responseData = typeof error === 'object' && error !== null ? (error as any)?.response?.data : undefined;
    console.error('api/tickets: scanTicketFromFile failed', { status, url, responseData, error });
    throw error;
  }
};

export const getTicketsByBooking = (bookingId: number): Promise<Ticket[]> =>
  apiClient.get<Ticket[]>(`/api/v1/support/bookings/${bookingId}/tickets`).then(res => res.data);

export const getTicketsByUser = (userId: number): Promise<Ticket[]> =>
  apiClient.get<Ticket[]>(`/api/v1/support/tickets/user/${userId}`).then(res => res.data);
