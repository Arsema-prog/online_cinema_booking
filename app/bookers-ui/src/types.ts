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
  price: number;
  availableSeats: number;
  totalSeats: number;
  movie: Movie;
  screen: {
    id: number;
    name: string;
    capacity: number;
    seatsPerRow: number;
    branch: {
      id: number;
      name: string;
      address: string;
    };
  };
}

export interface MovieWithScreenings {
  movie: Movie;
  screenings: Screening[];
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



export interface Seat {
  id: string;
  row: string;
  number: number;
  price: number;
  status: 'available' | 'selected' | 'booked' | 'blocked';
  type?: 'normal' | 'vip' | 'vvip';
}

export interface Showtime {
  id: string;
  time: string;
  date: string;
  availableSeats: number;
  totalSeats: number;
  priceNormal: number;
  priceVIP: number;
  priceVVIP: number;
}

export interface Booking {
  id: string;
  movieId: string;
  movieName: string;
  showtime: string;
  date: string;
  seats: Seat[];
  totalAmount: number;
  bookingDate: string;
  status: 'confirmed' | 'cancelled';
}