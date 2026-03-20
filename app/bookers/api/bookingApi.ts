import { bookingClient } from "../../httpClient";
import { HoldRequest, HoldResponse } from "../../types";

export const BookingApi = {
  holdSeats(payload: HoldRequest): Promise<HoldResponse> {
    return bookingClient.post<HoldResponse>("/bookings/hold", payload).then(r => r.data);
  },
  confirm(bookingId: string): Promise<void> {
    return bookingClient.post(`/bookings/${bookingId}/confirm`).then(() => {});
  },
  cancel(bookingId: string): Promise<void> {
    return bookingClient.post(`/bookings/${bookingId}/cancel`).then(() => {});
  }
};

