// api/bookingApi.ts
import axios from "axios";
import { env } from "../env";

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

export const getScreeningSeats = async (screeningId: number): Promise<ScreeningSeat[]> => {
  const response = await axios.get(`${env.coreServiceUrl}/screenings/${screeningId}/seats`);
  return response.data;
};

export const holdSeats = async (screeningId: number, seatIds: number[]): Promise<ScreeningSeat[]> => {
  const response = await axios.post(
    `${env.coreServiceUrl}/screenings/${screeningId}/holds`,
    seatIds,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
};

export const reserveSeats = async (screeningId: number, seatIds: number[]): Promise<ScreeningSeat[]> => {
  const response = await axios.post(
    `${env.coreServiceUrl}/screenings/${screeningId}/reserve`,
    seatIds,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
};

export const releaseHold = async (seatId: number): Promise<void> => {
  await axios.delete(`${env.coreServiceUrl}/screenings/holds/${seatId}`);
};