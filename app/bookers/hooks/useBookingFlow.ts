import { useState } from "react";
import { HoldRequest, HoldResponse } from "../../types";
import { BookingApi } from "../api/bookingApi";

export const useBookingFlow = () => {
  const [hold, setHold] = useState<HoldResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startHold = async (payload: HoldRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await BookingApi.holdSeats(payload);
      setHold(response);
    } catch (err: any) {
      setError(err.normalizedMessage || "Unable to hold seats");
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!hold) return;
    setLoading(true);
    setError(null);
    try {
      await BookingApi.confirm(hold.bookingId);
    } catch (err: any) {
      setError(err.normalizedMessage || "Unable to confirm booking");
    } finally {
      setLoading(false);
    }
  };

  const cancel = async () => {
    if (!hold) return;
    setLoading(true);
    setError(null);
    try {
      await BookingApi.cancel(hold.bookingId);
      setHold(null);
    } catch (err: any) {
      setError(err.normalizedMessage || "Unable to cancel booking");
    } finally {
      setLoading(false);
    }
  };

  return { hold, loading, error, startHold, confirm, cancel };
};

