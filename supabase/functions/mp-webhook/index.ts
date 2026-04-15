import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
    }

    const body = await req.json();
    console.log("MP webhook received:", JSON.stringify(body));

    // Mercado Pago sends different notification types
    if (body.type !== "payment" && body.action !== "payment.created" && body.action !== "payment.updated") {
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    // Fetch payment details from MP
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      }
    );

    if (!mpResponse.ok) {
      console.error("Failed to fetch MP payment:", mpResponse.status);
      return new Response("error", { status: 500, headers: corsHeaders });
    }

    const payment = await mpResponse.json();
    const bookingId = payment.external_reference;

    if (!bookingId) {
      console.log("No external_reference in payment");
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (payment.status === "approved") {
      // Update booking to paid
      await supabase
        .from("bookings")
        .update({ status: "paid" })
        .eq("id", bookingId);

      // Update payment record
      await supabase
        .from("payments")
        .update({ status: "completed" })
        .eq("booking_id", bookingId);

      // Deduct seats from trip
      const { data: booking } = await supabase
        .from("bookings")
        .select("trip_id, seats")
        .eq("id", bookingId)
        .single();

      if (booking) {
        const { data: trip } = await supabase
          .from("trips")
          .select("available_seats")
          .eq("id", booking.trip_id)
          .single();

        if (trip) {
          const newSeats = Math.max(0, trip.available_seats - booking.seats);
          await supabase
            .from("trips")
            .update({
              available_seats: newSeats,
              status: newSeats === 0 ? "full" : "active",
            })
            .eq("id", booking.trip_id);
        }
      }

      console.log(`Booking ${bookingId} marked as paid`);
    } else if (payment.status === "rejected" || payment.status === "cancelled") {
      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("booking_id", bookingId);

      console.log(`Payment for booking ${bookingId} failed: ${payment.status}`);
    }

    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("error", { status: 500, headers: corsHeaders });
  }
});
