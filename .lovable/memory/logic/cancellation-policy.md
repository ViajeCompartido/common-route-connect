---
name: Smart Cancellation Policy
description: Refund rules based on booking status and time to departure, with driver progress tracking
type: feature
---

## Booking Progress States (in order)
1. pending → accepted → coordinating → paid → driver_on_way → driver_arrived → in_transit → completed

## Refund Rules for Passenger Cancellation
- **Pre-payment** (pending/accepted/coordinating): 100% — no penalty
- **Paid, >24h before**: 100%
- **Paid, 2-24h before**: 80%
- **Paid, <2h before**: 50%
- **Paid, past departure**: 20%
- **Driver on way**: 30%
- **Driver arrived**: 10%
- **In transit / completed**: 0% — cannot cancel

## Driver Progress Buttons (in MyTrips driver tab)
- "En camino" → sets trip to in_progress, bookings to driver_on_way
- "Llegué" → sets bookings to driver_arrived
- "Iniciar viaje" → sets bookings to in_transit
- "Finalizar" → completes trip and all bookings

## DB Function
`calculate_refund_percentage(_booking_id)` mirrors these rules server-side.

## UI
Cancel confirmation dialog shows refund percentage and explanation before confirming.
