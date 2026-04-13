export type UserRole = 'passenger' | 'driver' | 'admin';

export type BadgeType =
  | 'viajero_frecuente' | 'puntual' | 'pet_friendly' | 'recomendado'
  | 'chofer_confiable' | 'verificado';

export interface UserBadge {
  type: BadgeType;
  label: string;
  icon: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  city?: string;
  rating: number;
  totalRatings: number;
  totalTrips: number;
  verified: boolean;
  createdAt: string;
  punctuality?: number;
  cancellationRate?: number;
  badges?: UserBadge[];
  // Driver-specific
  vehicle?: string;
  plate?: string;
  maxSeats?: number;
  acceptsPets?: boolean;
}

export interface PriceRange {
  routeKey: string;
  suggested: number;
  min: number;
  max: number;
}

export interface Trip {
  id: string;
  driverId: string;
  driverName: string;
  driverAvatar?: string;
  driverRating: number;
  driverTotalTrips: number;
  driverVerified: boolean;
  origin: string;
  destination: string;
  zone?: string;
  meetingPoint?: string;
  date: string;
  time: string;
  availableSeats: number;
  totalSeats: number;
  pricePerSeat: number;
  acceptsPets: boolean;
  hasPet: boolean;
  allowsLuggage: boolean;
  observations?: string;
  status: 'active' | 'paused' | 'full' | 'completed' | 'cancelled' | 'in_progress';
}

export interface RideRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerAvatar?: string;
  passengerRating: number;
  passengerTrips: number;
  passengerVerified: boolean;
  origin: string;
  destination: string;
  zone?: string;
  date: string;
  time: string;
  seats: number;
  hasPet: boolean;
  hasLuggage: boolean;
  message?: string;
  status: 'active' | 'matched' | 'expired';
}

export interface Booking {
  id: string;
  tripId: string;
  passengerId: string;
  passengerName: string;
  driverName: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  seats: number;
  pricePerSeat: number;
  hasPet: boolean;
  hasLuggage: boolean;
  meetingPoint?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'coordinating' | 'paid' | 'completed' | 'cancelled_passenger' | 'cancelled_driver' | 'rejected';
  cancellationReason?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  toUserId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  message: string;
  createdAt: string;
}
