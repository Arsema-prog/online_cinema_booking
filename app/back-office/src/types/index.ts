// src/types/index.ts
export interface Branch {
  id: number;
  name: string;
  address: string;
  city?: string;
  country?: string;
  totalScreens?: number;
  isActive?: boolean;
  phoneNumber?: string;
  screens?: Screen[];
}

export interface Movie {
  id: number;
  title: string;
  genre: string;
  duration: number;
  description?: string;
  director?: string;
  releaseDate?: string;
  rating?: number;
  posterUrl?: string;
  basePrice?: number;
  isActive?: boolean;
}

export interface Screen {
  id: number;
  name: string;
  screenNumber?: number;
  capacity?: number;
  rowsCount?: number;
  seatsPerRow?: number;
  isActive?: boolean;
  branch: Branch;
}

export interface Screening {
  id: number;
  price?: number;
  availableSeats?: number;
  totalSeats?: number;
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
  rowLabel?: string;
  isAvailable?: boolean;
  screen: Screen;
}

export interface ScreeningSeat {
  id: number;
  screening: Screening;
  seat: Seat;
  isBooked: boolean;
  price?: number;
  status?: string;
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

export interface RuleSet {
  id: number;
  name: string;
  version: string;
  active: boolean;
  drlContent: string;
  createdAt: string;
}

export interface Snack {
  id: number;
  name: string;
  description?: string;
  category: 'SNACK' | 'DRINK' | 'COMBO' | 'POPCORN' | 'CANDY';
  price: number;
  stockQuantity: number;
  available: boolean;
  imageUrl?: string;
}