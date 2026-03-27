// src/types/index.ts
export interface Branch {
  id: number;
  name: string;
  address: string;
}

export interface Movie {
  id: number;
  title: string;
  genre: string;
  duration: number;
}

export interface Screen {
  id: number;
  name: string;
  rows?: number;
  seatsPerRow?: number;
  branch: Branch;
}

export interface Screening {
  id: number;
  startTime: string;   // ISO datetime string
  endTime: string;
  movie: Movie;
  screen: Screen;
  // optionally screeningSeats?: ScreeningSeat[];
}

export interface Seat {
  id: number;
  seatNumber: string;
  seatType?: string;
  rowNumber?: number;
  screen: Screen;
}

export interface ScreeningSeat {
  id: number;
  screening: Screening;
  seat: Seat;
  status: 'AVAILABLE' | 'HELD' | 'RESERVED' | 'CANCELLED';
}

export interface User {
  id: string;           // Keycloak UUID
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  roles: string[];
  createdTimestamp: string; // ISO string
}