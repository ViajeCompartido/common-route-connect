---
name: Smart Cancellation Policy
description: Refund rules, cancellation flow with reason capture, refund tracking and admin oversight
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

## Driver Cancellation
- Always 100% refund to passengers (`cancel_trip_as_driver` cancels all bookings)
- Can affect driver reputation
- Reason is mandatory

## Reason Capture
Passenger and driver each have predefined categories in `src/lib/cancellationReasons.ts` (editable). "Other" requires free-text. Reason stored in `bookings.cancellation_reason` and full record in `cancellations` table.

## Refund States (`cancellations.refund_status`)
- `not_applicable` (pre-payment)
- `pending` (created, awaiting admin to process)
- `processing`
- `completed` (admin marked via `mark_refund_completed`)
- `failed`

## Editable Policy
`cancellation_policy` table (admin-only edit) holds rule rows with `min_hours_before`, `refund_percentage`, `applies_to_status`. The DB function `calculate_refund_percentage` mirrors it for fast lookups.

## Driver Progress Buttons (in MyTrips driver tab)
- "En camino" → trip in_progress, bookings driver_on_way
- "Llegué" → bookings driver_arrived
- "Iniciar viaje" → bookings in_transit
- "Finalizar" → trip + bookings completed
- "Cancelar viaje" → opens reason dialog → calls `cancel_trip_as_driver`

## Admin
`AdminCancellations` tab in admin panel: shows pending refunds, total refunded, full history with reasons. Admin clicks "Marcar reembolso realizado" to close the loop.

## Key files
- DB: `cancel_booking`, `cancel_trip_as_driver`, `mark_refund_completed`, `calculate_refund_percentage`
- UI: `src/components/CancelBookingDialog.tsx`, `src/components/admin/AdminCancellations.tsx`
- Logic: `src/lib/cancellationPolicy.ts`, `src/lib/cancellationReasons.ts`
