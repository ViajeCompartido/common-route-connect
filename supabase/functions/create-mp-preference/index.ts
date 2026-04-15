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
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { booking_id } = await req.json();
    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: "booking_id es requerido" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch booking with trip info
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, trips(*)")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: "Reserva no encontrada" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (booking.passenger_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "No tenés permiso para pagar esta reserva" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate amounts
    const basePrice = booking.price_per_seat * booking.seats;
    const petSurcharge = booking.pet_surcharge || 0;
    const subtotal = basePrice + petSurcharge;
    const serviceFee = Math.round(subtotal * 0.07);
    const total = subtotal + serviceFee;

    const trip = booking.trips;

    // Create Mercado Pago preference
    const preference = {
      items: [
        {
          title: `Viaje ${trip.origin} → ${trip.destination}`,
          description: `${booking.seats} asiento(s) - ${trip.date} ${trip.time}hs`,
          quantity: 1,
          unit_price: total,
          currency_id: "ARS",
        },
      ],
      external_reference: booking_id,
      back_urls: {
        success: `${req.headers.get("origin") || "https://common-route-connect.lovable.app"}/my-trips?payment=success`,
        failure: `${req.headers.get("origin") || "https://common-route-connect.lovable.app"}/trip/${trip.id}?payment=failure`,
        pending: `${req.headers.get("origin") || "https://common-route-connect.lovable.app"}/my-trips?payment=pending`,
      },
      auto_return: "approved",
      notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
    };

    const mpResponse = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(preference),
      }
    );

    if (!mpResponse.ok) {
      const errorBody = await mpResponse.text();
      console.error("MP error:", mpResponse.status, errorBody);
      throw new Error(`Mercado Pago error [${mpResponse.status}]: ${errorBody}`);
    }

    const mpData = await mpResponse.json();

    // Record payment intent
    await supabase.from("payments").insert({
      booking_id,
      passenger_id: user.id,
      driver_id: booking.driver_id,
      amount: total,
      platform_fee: serviceFee,
      driver_payout: subtotal,
      status: "pending",
      payment_method: "mercadopago",
    });

    return new Response(
      JSON.stringify({
        init_point: mpData.init_point,
        preference_id: mpData.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating preference:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
