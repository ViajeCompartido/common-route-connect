import { Trip, User, Review, RideRequest, Booking, PriceRange, UserBadge } from '@/types';

export const mockTrips: Trip[] = [
  {
    id: '1', driverId: 'd1', driverName: 'Carlos Méndez', driverAvatar: '', driverRating: 4.8,
    driverTotalTrips: 45, driverVerified: true, origin: 'Palermo, Buenos Aires', destination: 'La Plata Centro',
    zone: 'CABA', date: '2026-04-15', time: '08:00', availableSeats: 3, totalSeats: 4,
    pricePerSeat: 2500, acceptsPets: true, hasPet: false, allowsLuggage: true, status: 'active',
    meetingPoint: 'Estación de servicio YPF, Av. Santa Fe y Scalabrini Ortiz',
  },
  {
    id: '2', driverId: 'd2', driverName: 'María López', driverAvatar: '', driverRating: 4.9,
    driverTotalTrips: 78, driverVerified: true, origin: 'Nueva Córdoba', destination: 'Rosario Centro',
    zone: 'Córdoba Capital', date: '2026-04-16', time: '10:30', availableSeats: 2, totalSeats: 3,
    pricePerSeat: 4000, acceptsPets: false, hasPet: false, allowsLuggage: true, status: 'active',
    meetingPoint: 'Terminal de Ómnibus de Córdoba',
  },
  {
    id: '3', driverId: 'd3', driverName: 'Jorge Fernández', driverAvatar: '', driverRating: 4.5,
    driverTotalTrips: 23, driverVerified: false, origin: 'Godoy Cruz, Mendoza', destination: 'San Juan Centro',
    zone: 'Gran Mendoza', date: '2026-04-17', time: '07:00', availableSeats: 1, totalSeats: 4,
    pricePerSeat: 3500, acceptsPets: true, hasPet: true, allowsLuggage: false, status: 'active',
    meetingPoint: 'Plaza Godoy Cruz',
  },
  {
    id: '4', driverId: 'd1', driverName: 'Carlos Méndez', driverAvatar: '', driverRating: 4.8,
    driverTotalTrips: 45, driverVerified: true, origin: 'City Bell, La Plata', destination: 'Retiro, Buenos Aires',
    zone: 'Gran La Plata', date: '2026-04-18', time: '18:00', availableSeats: 4, totalSeats: 4,
    pricePerSeat: 2500, acceptsPets: true, hasPet: false, allowsLuggage: true, status: 'active',
    meetingPoint: 'Estación City Bell',
  },
  {
    id: '5', driverId: 'd4', driverName: 'Lucía Torres', driverAvatar: '', driverRating: 5.0,
    driverTotalTrips: 112, driverVerified: true, origin: 'Belgrano, Buenos Aires', destination: 'Mar del Plata Centro',
    zone: 'CABA', date: '2026-04-19', time: '06:00', availableSeats: 2, totalSeats: 3,
    pricePerSeat: 6500, acceptsPets: true, hasPet: false, allowsLuggage: true, status: 'active',
    meetingPoint: 'Estación Belgrano C',
  },
  {
    id: '6', driverId: 'd5', driverName: 'Pablo Ramírez', driverAvatar: '', driverRating: 4.7,
    driverTotalTrips: 34, driverVerified: true, origin: 'Caballito, Buenos Aires', destination: 'La Plata',
    zone: 'CABA', date: '2026-04-15', time: '06:30', availableSeats: 2, totalSeats: 4,
    pricePerSeat: 2200, acceptsPets: false, hasPet: false, allowsLuggage: true, status: 'active',
    meetingPoint: 'Parque Rivadavia, entrada por Av. Rivadavia',
  },
  {
    id: '7', driverId: 'd6', driverName: 'Valentina Suárez', driverAvatar: '', driverRating: 4.6,
    driverTotalTrips: 19, driverVerified: true, origin: 'Vicente López', destination: 'La Plata',
    zone: 'Zona Norte GBA', date: '2026-04-15', time: '07:15', availableSeats: 3, totalSeats: 4,
    pricePerSeat: 2800, acceptsPets: true, hasPet: false, allowsLuggage: true, status: 'active',
    meetingPoint: 'Estación Vicente López (tren Mitre)',
  },
];

export const mockUser: User = {
  id: 'p1', name: 'Ana García', email: 'ana@email.com', phone: '+54 11 1234-5678',
  role: 'passenger', city: 'Buenos Aires', rating: 4.7, totalRatings: 12, totalTrips: 12,
  verified: true, createdAt: '2025-06-15', punctuality: 95, cancellationRate: 3,
  badges: [
    { type: 'viajero_frecuente', label: 'Viajera frecuente', icon: '🏆' },
    { type: 'puntual', label: 'Puntual', icon: '⏰' },
    { type: 'pet_friendly', label: 'Pet friendly', icon: '🐾' },
    { type: 'recomendado', label: 'Recomendada', icon: '⭐' },
  ],
};

export const mockDriverUser: User = {
  id: 'd1', name: 'Carlos Méndez', email: 'carlos@email.com', phone: '+54 11 9876-5432',
  role: 'driver', city: 'Buenos Aires', rating: 4.8, totalRatings: 45, totalTrips: 45,
  verified: true, createdAt: '2025-03-10', punctuality: 98, cancellationRate: 1,
  vehicle: 'Volkswagen Vento 2022 - Gris', plate: 'AB 123 CD', maxSeats: 4, acceptsPets: true,
  badges: [
    { type: 'chofer_confiable', label: 'Chofer confiable', icon: '🛡️' },
    { type: 'puntual', label: 'Puntual', icon: '⏰' },
    { type: 'pet_friendly', label: 'Pet friendly', icon: '🐾' },
    { type: 'verificado', label: 'Verificado', icon: '✅' },
  ],
};

export const mockReviews: Review[] = [
  { id: 'r1', fromUserId: 'p1', fromUserName: 'Ana García', fromUserAvatar: '', toUserId: 'd1', rating: 5, comment: 'Excelente viaje, muy puntual y amable. El auto estaba impecable.', createdAt: '2026-03-20' },
  { id: 'r2', fromUserId: 'p2', fromUserName: 'Lucas Pérez', fromUserAvatar: '', toUserId: 'd1', rating: 4, comment: 'Buen viaje, auto cómodo. Llegamos a horario.', createdAt: '2026-03-15' },
  { id: 'r3', fromUserId: 'p3', fromUserName: 'Sofía Ruiz', fromUserAvatar: '', toUserId: 'd1', rating: 5, comment: 'Súper recomendable, viajé con mi perro y sin problemas.', createdAt: '2026-02-28' },
  { id: 'r4', fromUserId: 'p4', fromUserName: 'Martín Gómez', fromUserAvatar: '', toUserId: 'd1', rating: 5, comment: 'Muy buena onda, excelente conductor. Repetiría sin dudas.', createdAt: '2026-02-15' },
];

export const mockRideRequests: RideRequest[] = [
  {
    id: 'rr1', passengerId: 'p1', passengerName: 'Ana García', passengerRating: 4.7,
    passengerTrips: 12, passengerVerified: true, origin: 'Palermo, Buenos Aires',
    destination: 'La Plata', zone: 'CABA', date: '2026-04-15', time: '07:30',
    seats: 1, hasPet: false, hasLuggage: true, message: 'Necesito llegar temprano, soy flexible con el punto de encuentro.',
    status: 'active',
  },
  {
    id: 'rr2', passengerId: 'p2', passengerName: 'Lucas Pérez', passengerRating: 4.5,
    passengerTrips: 8, passengerVerified: true, origin: 'Belgrano, Buenos Aires',
    destination: 'La Plata', zone: 'CABA', date: '2026-04-15', time: '08:00',
    seats: 2, hasPet: true, hasLuggage: false, message: 'Viajo con mi perro mediano, es tranquilo.',
    status: 'active',
  },
  {
    id: 'rr3', passengerId: 'p5', passengerName: 'Camila Herrera', passengerRating: 4.9,
    passengerTrips: 31, passengerVerified: true, origin: 'Núñez, Buenos Aires',
    destination: 'Mar del Plata', zone: 'CABA', date: '2026-04-19', time: '06:30',
    seats: 1, hasPet: false, hasLuggage: true, message: 'Llevo una valija grande.',
    status: 'active',
  },
];

export const mockBookings: Booking[] = [
  {
    id: 'b1', tripId: '1', passengerId: 'p1', passengerName: 'Ana García', driverName: 'Carlos Méndez',
    origin: 'Palermo, Buenos Aires', destination: 'La Plata Centro', date: '2026-04-15', time: '08:00',
    seats: 1, pricePerSeat: 2500, hasPet: false, hasLuggage: true,
    status: 'paid', createdAt: '2026-04-12',
  },
  {
    id: 'b2', tripId: '5', passengerId: 'p1', passengerName: 'Ana García', driverName: 'Lucía Torres',
    origin: 'Belgrano, Buenos Aires', destination: 'Mar del Plata Centro', date: '2026-04-19', time: '06:00',
    seats: 1, pricePerSeat: 6500, hasPet: false, hasLuggage: true,
    status: 'coordinating', createdAt: '2026-04-11',
  },
  {
    id: 'b3', tripId: '2', passengerId: 'p1', passengerName: 'Ana García', driverName: 'María López',
    origin: 'Nueva Córdoba', destination: 'Rosario Centro', date: '2026-03-20', time: '10:30',
    seats: 1, pricePerSeat: 4000, hasPet: false, hasLuggage: false,
    status: 'completed', createdAt: '2026-03-18',
  },
  {
    id: 'b4', tripId: '6', passengerId: 'p1', passengerName: 'Ana García', driverName: 'Pablo Ramírez',
    origin: 'Caballito', destination: 'La Plata', date: '2026-04-15', time: '06:30',
    seats: 1, pricePerSeat: 2200, hasPet: false, hasLuggage: false,
    status: 'pending', message: 'Salgo de Caballito, puedo acercarme a Parque Rivadavia.',
    createdAt: '2026-04-12',
  },
];

export const verifiedDrivers = [
  { id: 'd1', name: 'Carlos M.', rating: 4.8, trips: 45, verified: true },
  { id: 'd2', name: 'María L.', rating: 4.9, trips: 78, verified: true },
  { id: 'd4', name: 'Lucía T.', rating: 5.0, trips: 112, verified: true },
  { id: 'd5', name: 'Pablo R.', rating: 4.7, trips: 34, verified: true },
];

export const routePriceRanges: PriceRange[] = [
  { routeKey: 'buenos_aires-la_plata', suggested: 2500, min: 1800, max: 3500 },
  { routeKey: 'punta_alta-bahia_blanca', suggested: 7500, min: 6000, max: 9000 },
  { routeKey: 'cordoba-rosario', suggested: 4000, min: 3000, max: 5500 },
  { routeKey: 'buenos_aires-mar_del_plata', suggested: 6500, min: 5000, max: 8500 },
  { routeKey: 'mendoza-san_juan', suggested: 3500, min: 2500, max: 5000 },
];
