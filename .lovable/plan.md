## Objetivo

Implementar matching automático bidireccional, ofertas entre chofer y pasajero con estados compartidos, notificaciones in-app con campanita y descuento automático de asientos al aceptar — sin tocar el diseño actual.

## 1. Base de datos (migración)

### Nueva tabla `trip_offers`
Representa una oferta enviada entre un chofer y un pasajero a partir de un match.
- `id` uuid PK
- `trip_id` uuid (viaje del chofer)
- `ride_request_id` uuid nullable (publicación del pasajero, si existe)
- `driver_id` uuid
- `passenger_id` uuid
- `initiated_by` text ('driver' | 'passenger')
- `seats` int default 1
- `message` text nullable
- `status` text ('pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired') default 'pending'
- `booking_id` uuid nullable (se setea al aceptar y crear booking)
- `created_at`, `updated_at`
- UNIQUE (`trip_id`, `passenger_id`) para evitar duplicados activos (con índice parcial sobre status pending/accepted)
- RLS: SELECT si auth.uid() = driver_id OR passenger_id; INSERT por driver o passenger según `initiated_by`; UPDATE por participantes.

### Nueva tabla `notifications`
- `id` uuid PK
- `user_id` uuid (destinatario)
- `type` text ('offer_received' | 'offer_accepted' | 'offer_rejected' | 'new_message' | 'match_found')
- `title` text
- `body` text
- `data` jsonb (ids relacionados: offer_id, trip_id, booking_id, from_user_id, etc.)
- `read` boolean default false
- `created_at`
- RLS: SELECT/UPDATE solo el `user_id`; INSERT permitido vía SECURITY DEFINER functions.

### Función `accept_trip_offer(_offer_id uuid)`
SECURITY DEFINER. Solo el `passenger_id` puede llamarla. Hace:
1. Verifica oferta `pending`.
2. Verifica `trips.available_seats >= seats`.
3. Crea booking con status `accepted` (los triggers existentes ya descuentan asientos vía `sync_trip_seat_counters`).
4. Marca offer `accepted` con `booking_id`.
5. Inserta notificación al chofer ("El pasajero aceptó tu solicitud").
6. Realtime publica el cambio.

### Función `reject_trip_offer(_offer_id uuid, _reason text)`
Marca rechazada y notifica al chofer.

### Función `create_trip_offer(...)`
SECURITY DEFINER. Valida no-duplicados (ya hay UNIQUE pero devuelve mensaje claro), inserta offer, inserta notificación al receptor.

### Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE trip_offers, notifications.

## 2. Matching automático

### Nuevo hook `useCompatibleMatches.ts`
- Para chofer viendo su viaje: query `ride_requests` activos, filtra con `isLocationCompatible` (origen+destino), `isDateCompatible`, `isTimeCompatible` (tolerancia 120 min), y `seats <= trip.available_seats`.
- Para pasajero viendo su solicitud: query `trips` activos con misma lógica inversa.
- Suscripción realtime a `trips` y `ride_requests` para refresco automático.

### Integración
- `MyTrips.tsx` (vista chofer): para cada viaje activo, mostrar sección "Pasajeros compatibles" con botón "Enviar oferta".
- `MyTrips.tsx` (vista pasajero): para cada ride_request activa, mostrar "Choferes compatibles" con botón "Solicitar viaje".
- `CompatiblePassengers.tsx`: ya existe, ahora cablear el botón al flujo real (crear offer + notif).

## 3. Ofertas y notificaciones

### Nuevos componentes
- `OfferDialog.tsx`: modal para enviar oferta (mensaje opcional, seats), llama RPC `create_trip_offer`.
- `NotificationsBell.tsx`: integrar en `AppHeader` (ya existe Notifications page, ahora con badge contador en tiempo real).
- `OffersInbox` sección dentro de `MyTrips`:
  - Chofer: lista de ofertas enviadas con estado.
  - Pasajero: lista de ofertas recibidas con botones Aceptar/Rechazar/Chatear.

### Actualizar `Notifications.tsx`
- Reemplazar fuente mock por tabla `notifications`.
- Marcar como leída al abrir.
- Tap → navega al detalle del viaje/oferta correspondiente.
- Badge en campanita del header con contador `unread`.

### Hook `useNotifications.ts`
- Trae notificaciones del usuario, suscripción realtime, función `markAsRead`, contador `unreadCount`.

## 4. Descuento de asientos
Ya cubierto por `sync_trip_seat_counters` + triggers existentes en `bookings`. La función `accept_trip_offer` crea el booking con status `accepted` (que ocupa asiento) → trigger descuenta. Si llega a 0, status del trip pasa a `full`. Sin cambios extra necesarios.

## 5. Archivos a crear/editar

**Crear:**
- Migración SQL (`trip_offers`, `notifications`, RPCs, realtime)
- `src/hooks/useCompatibleMatches.ts`
- `src/hooks/useNotifications.ts`
- `src/components/OfferDialog.tsx`
- `src/components/CompatibleMatchesSection.tsx` (reutilizable para MyTrips)

**Editar:**
- `src/pages/MyTrips.tsx`: insertar sección de matches + ofertas por viaje/solicitud.
- `src/pages/CompatiblePassengers.tsx`: cablear botón "Ofrecerme como chofer" al RPC.
- `src/pages/Notifications.tsx`: leer de tabla real, marcar como leídas.
- `src/components/AppHeader.tsx`: badge de notificaciones no leídas en la campanita.
- `src/integrations/supabase/types.ts`: regenerado automáticamente por la migración.

## Resultado esperado (prueba dorada)
Chofer A publica BB→Viedma 15:00 / 3 asientos. Pasajero B publica BB→Viedma 14:30 / 1 asiento.
- Ambos se ven en sus respectivas listas de "compatibles" sin búsqueda manual.
- Chofer envía oferta → B recibe notificación con badge.
- B acepta → booking creado, asientos del trip pasan de 3 a 2, A recibe notificación de aceptación, ambos ven el estado en "Mis viajes" y pueden chatear (el chat existente ya se desbloquea con booking).