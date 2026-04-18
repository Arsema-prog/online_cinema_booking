import apiClient from '../httpClient';
import { getAccessTokenGetter } from '../httpClient';

export type ScreeningSeatStatus = 'AVAILABLE' | 'HELD' | 'RESERVED' | 'CANCELLED';

export interface ScreeningSeat {
  id: number;
  isBooked?: boolean | null;
  seat: {
    id: number;
    seatNumber: string;
    rowLabel: string;
  };
  status: ScreeningSeatStatus;
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

export interface BookingDetails {
  id: string;
  userId?: string;
  showId?: string;
  status: string;
  movieTitle?: string | null;
  branchName?: string | null;
  screenName?: string | null;
  showTime?: string | null;
  totalAmount: number;
  snacksTotal: number;
  snackDetails?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  seatCount?: number | null;
}

export interface BookingSeatInfo {
  seatId?: string;
  seatNumber: string;
  rowLabel?: string | null;
}

export interface PriceQuoteBreakdownItem {
  ruleName?: string;
  description?: string;
  appliedValue?: unknown;
}

export interface SeatPriceQuote {
  amount: number;
  currency: string;
  activeRuleVersion?: string;
  breakdown: PriceQuoteBreakdownItem[];
}

interface RawScreeningSeat {
  id: number;
  isBooked?: boolean | null;
  seat: {
    id: number;
    seatNumber: string;
    rowLabel: string;
  };
  status?: string | null;
  price?: number | null;
}

interface RawBookingDetails {
  id: string;
  userId?: string;
  showId?: string;
  status?: string | null;
  movieTitle?: string | null;
  branchName?: string | null;
  screenName?: string | null;
  showTime?: string | null;
  totalAmount?: number | string | null;
  snacksTotal?: number | string | null;
  snackDetails?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  seatCount?: number | null;
}

interface RawBookingSeatInfo {
  seatId?: string;
  seatNumber?: string | null;
  rowLabel?: string | null;
}

interface RawSeatPriceQuote {
  finalPrice?: number | null;
  currency?: string | null;
  activeRuleVersion?: string | null;
  breakdown?: PriceQuoteBreakdownItem[] | null;
}

const normalizeSeatStatus = (
  status?: string | null,
  isBooked?: boolean | null
): ScreeningSeatStatus => {
  const normalized = status?.trim().toUpperCase();

  switch (normalized) {
    case 'AVAILABLE':
      return 'AVAILABLE';
    case 'HELD':
      return 'HELD';
    case 'BOOKED':
    case 'RESERVED':
      return 'RESERVED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      // Core service only exposes a coarse isBooked flag. Until booking-service
      // overlays the precise status, treat blocked seats as temporarily held.
      return isBooked ? 'HELD' : 'AVAILABLE';
  }
};

const normalizeScreeningSeat = (seat: RawScreeningSeat): ScreeningSeat => ({
  id: seat.id,
  isBooked: seat.isBooked ?? null,
  seat: {
    id: seat.seat.id,
    seatNumber: seat.seat.seatNumber,
    rowLabel: seat.seat.rowLabel
  },
  status: normalizeSeatStatus(seat.status, seat.isBooked),
  price: Number(seat.price ?? 0)
});

const normalizeMoney = (value?: number | string | null): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeBookingDetails = (booking: RawBookingDetails): BookingDetails => ({
  id: booking.id,
  userId: booking.userId,
  showId: booking.showId,
  status: booking.status ?? 'UNKNOWN',
  movieTitle: booking.movieTitle ?? null,
  branchName: booking.branchName ?? null,
  screenName: booking.screenName ?? null,
  showTime: booking.showTime ?? null,
  totalAmount: normalizeMoney(booking.totalAmount),
  snacksTotal: normalizeMoney(booking.snacksTotal),
  snackDetails: booking.snackDetails ?? null,
  createdAt: booking.createdAt ?? null,
  updatedAt: booking.updatedAt ?? null,
  seatCount: booking.seatCount ?? null
});

const formatLocalDateTime = (date: Date): string => {
  const pad = (value: number) => value.toString().padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const normalizeLocalDateTime = (value?: string | null): string | undefined => {
  if (!value) return undefined;

  if (/([zZ]|[+\-]\d{2}:\d{2})$/.test(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return formatLocalDateTime(parsed);
    }
  }

  return value.replace(/\.\d+$/, '').replace(/[zZ]$/, '');
};

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
  const response = await apiClient.get<RawScreeningSeat[]>(`/api/v1/core/screening-seats/screening/${screeningId}`);
  return response.data.map(normalizeScreeningSeat);
};

// Get seat UUID mapping for a screening
export const getSeatUuidMapping = async (screeningId: number): Promise<Record<string, string>> => {
  const response = await apiClient.get(`/api/v1/core/screening-seats/screening/${screeningId}/seat-uuids`);
  return response.data;
};

// Hold seats
export const holdSeats = async (showId: string, seatIds: string[]): Promise<HoldResponse> => {
  const response = await apiClient.post(`/api/v1/booking/bookings/hold`, {
    showId,
    seatIds,
    userId: resolveUserIdFromToken()
  });
  return response.data;
};

export const getBookingSeatAvailability = async (showId: string): Promise<BookingSeatAvailability[]> => {
  const response = await apiClient.get(`/api/v1/booking/bookings/shows/${showId}/seats`);
  return response.data;
};

export const getBookingDetails = async (bookingId: string): Promise<BookingDetails> => {
  const response = await apiClient.get<RawBookingDetails>(`/api/v1/booking/bookings/${bookingId}`);
  return normalizeBookingDetails(response.data);
};

export const getBookingSeats = async (bookingId: string): Promise<BookingSeatInfo[]> => {
  const response = await apiClient.get<RawBookingSeatInfo[]>(`/api/v1/booking/bookings/${bookingId}/seats`);
  return response.data.map((seat) => ({
    seatId: seat.seatId,
    seatNumber: seat.seatNumber ?? 'Seat',
    rowLabel: seat.rowLabel ?? null
  }));
};

export const updateBookingSnacks = async (
  bookingId: string,
  snackDetails: string,
  snacksTotal: number
): Promise<BookingDetails> => {
  const response = await apiClient.post<RawBookingDetails>(`/api/v1/booking/bookings/${bookingId}/snacks`, {
    snackDetails,
    snacksTotal
  });
  return normalizeBookingDetails(response.data);
};

export const initiateBookingPayment = async (bookingId: string): Promise<BookingDetails> => {
  const response = await apiClient.post<RawBookingDetails>(`/api/v1/booking/bookings/${bookingId}/initiate-payment`);
  return normalizeBookingDetails(response.data);
};

export const getSeatPriceQuote = async (params: {
  screeningId?: number;
  seatCount: number;
  showTime?: string | null;
  currency?: string;
}): Promise<SeatPriceQuote> => {
  const currency = params.currency ?? 'USD';

  if (params.seatCount <= 0) {
    return {
      amount: 0,
      currency,
      breakdown: []
    };
  }

  const response = await apiClient.post<RawSeatPriceQuote>('/api/v1/support/rules/evaluate/price', {
    showId: params.screeningId,
    seatCount: params.seatCount,
    basePrice: 1500,
    showTime: normalizeLocalDateTime(params.showTime),
    bookingTime: formatLocalDateTime(new Date()),
    currency
  });

  return {
    amount: normalizeMoney(response.data.finalPrice) / 100,
    currency: response.data.currency ?? currency,
    activeRuleVersion: response.data.activeRuleVersion ?? undefined,
    breakdown: response.data.breakdown ?? []
  };
};

// Confirm booking
export const confirmBooking = async (bookingId: string, userEmail?: string): Promise<void> => {
  const params = userEmail && userEmail.trim() ? { userEmail } : undefined;
  await apiClient.post(`/api/v1/booking/bookings/${bookingId}/confirm`, null, { params });
};

// Cancel booking
export const cancelBooking = async (bookingId: string): Promise<void> => {
  await apiClient.post(`/api/v1/booking/bookings/${bookingId}/cancel`);
};
