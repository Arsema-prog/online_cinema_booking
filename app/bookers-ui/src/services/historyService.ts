import { getAccessTokenGetter } from '../httpClient';
import { env } from '../env';

export interface BookingHistoryModel {
  id: string;
  movieTitle: string;
  movieId: string;
  cinemaName: string;
  screenNumber: string;
  showTime: string;
  seats: string[];
  seatCount?: number;
  snacks?: string;
  snacksTotal?: number;
  totalAmount: number;
  status: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
  bookingDate: string;
  paymentTransactionId?: string;
}

const HISTORY_API_URL = `${env.apiGatewayUrl}/api/v1/booking/bookings`;

function decodeUserIdFromToken(token?: string): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded?.sub || null;
  } catch {
    return null;
  }
}

export const historyService = {
  /**
   * Fetches the booking history for the current authenticated user
   */
  async getUserHistory(userId?: string): Promise<BookingHistoryModel[]> {
    const token = getAccessTokenGetter()();
    const resolvedUserId = userId || decodeUserIdFromToken(token);

    if (!resolvedUserId) {
      console.error('Cannot fetch user history: user ID is missing');
      return [];
    }

    try {
      const response = await fetch(`${HISTORY_API_URL}/user/${resolvedUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      const mapped = await Promise.all(data.map(async (b: any) => {
        const seats = b.seats ? b.seats.map((s:any) => s.seatNumber) : [];
        let hydratedSeats = seats;
        let hydratedSnacks = b.snackDetails || b.snacks;
        let hydratedSnacksTotal = b.snacksTotal;

        if (hydratedSeats.length === 0 || !hydratedSnacks) {
          try {
            const [seatRes, bookingRes] = await Promise.all([
              fetch(`${HISTORY_API_URL}/${b.id}/seats`, {
                headers: { 'Authorization': `Bearer ${token}` }
              }),
              fetch(`${HISTORY_API_URL}/${b.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              })
            ]);

            if (seatRes.ok) {
              const seatData = await seatRes.json();
              hydratedSeats = Array.isArray(seatData)
                ? seatData.map((s: any) => s.seatNumber || s).filter(Boolean)
                : hydratedSeats;
            }

            if (bookingRes.ok) {
              const bookingData = await bookingRes.json();
              hydratedSnacks = hydratedSnacks || bookingData.snackDetails;
              hydratedSnacksTotal = hydratedSnacksTotal ?? bookingData.snacksTotal;
            }
          } catch {}
        }

        return ({
        id: b.id,
        movieTitle: b.movieTitle || 'Booked Movie', // Placeholder till DTO mapping is exact
        movieId: b.movieId || b.movie_id,
        cinemaName: b.cinemaName || b.branchName || '-',
        screenNumber: b.screenNumber || b.screenName || '-',
        showTime: b.showTime,
        seats: hydratedSeats,
        seatCount: b.seatCount ?? hydratedSeats.length,
        snacks: hydratedSnacks,
        snacksTotal: hydratedSnacksTotal,
        totalAmount: b.totalAmount,
        status: b.status,
        bookingDate: b.createdAt || b.bookingDate
      });
      }));
      return mapped;
    } catch (error) {
      console.error('Failed to fetch user history', error);
      return [];
    }
  },

  /**
   * Generates a pre-signed MinIO download URL for a specific booking ticket PDF
   * by requesting it securely from the backend.
   */
  async getTicketDownloadUrl(bookingId: string): Promise<string> {
    const token = getAccessTokenGetter()();
    try {
      const response = await fetch(`http://localhost:8084/api/support/bookings/${bookingId}/ticket-url`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to generate secure URL');
      const data = await response.json();
      return data.url; // Pre-signed MinIO URL
    } catch (error) {
      console.error('Error generating ticket URL:', error);
      throw error;
    }
  }
};
