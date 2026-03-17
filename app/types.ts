export interface Movie {
  id: number;
  title: string;
  genre: string;
  duration: number;
}

export interface Branch {
  id: number;
  name: string;
  address: string;
}

export interface Screen {
  id: number;
  name: string;
  rows: number;
  seatsPerRow: number;
  branch: Branch;
}

export interface Screening {
  id: number;
  startTime: string;
  endTime: string;
  movie: Movie;
  screen: Screen;
}

export interface Seat {
  id: number;
  seatNumber: string;
  seatType: string;
  rowNumber: number;
  screen: Screen;
}

export interface ScreeningSeat {
  id: number;
  screening: Screening;
  seat: Seat;
  status: string;
}

export type UUID = string;

export interface HoldRequest {
  userId: UUID;
  showId: UUID;
  seatIds: UUID[];
}

export interface HoldResponse {
  bookingId: UUID;
  status: string;
  heldSeatIds: UUID[];
  expiresAt: string;
}

export interface RegistrationRequest {
  username: string;
  password: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

export interface UserDto {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  roles?: string[];
  createdTimestamp?: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

