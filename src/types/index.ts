export type UserRole = 'passenger' | 'driver' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  rating: number;
  totalRatings: number;
  totalTrips: number;
  verified: boolean;
  createdAt: string;
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
  date: string;
  time: string;
  availableSeats: number;
  totalSeats: number;
  pricePerSeat: number;
  acceptsPets: boolean;
  hasPet: boolean;
  allowsLuggage: boolean;
  status: 'active' | 'full' | 'completed' | 'cancelled';
}

export interface Booking {
  id: string;
  tripId: string;
  passengerId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'paid' | 'completed';
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
