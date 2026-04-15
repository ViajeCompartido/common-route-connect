import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Expire ride requests older than 40 minutes past departure
  const { count: reqCount } = await supabase
    .from("ride_requests")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("date", new Date().toISOString().split("T")[0]) // past dates for sure
    .select("id", { count: "exact", head: true });

  // Also expire same-day requests where time + 40min has passed
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const cutoffTime = new Date(now.getTime() - 40 * 60 * 1000)
    .toTimeString()
    .slice(0, 8);

  const { count: reqTodayCount } = await supabase
    .from("ride_requests")
    .update({ status: "expired" })
    .eq("status", "active")
    .eq("date", today)
    .lt("time", cutoffTime)
    .select("id", { count: "exact", head: true });

  // Expire trips (mark as cancelled)
  const { count: tripCount } = await supabase
    .from("trips")
    .update({ status: "cancelled" })
    .eq("status", "active")
    .lt("date", today)
    .select("id", { count: "exact", head: true });

  const { count: tripTodayCount } = await supabase
    .from("trips")
    .update({ status: "cancelled" })
    .eq("status", "active")
    .eq("date", today)
    .lt("time", cutoffTime)
    .select("id", { count: "exact", head: true });

  const total =
    (reqCount ?? 0) + (reqTodayCount ?? 0) + (tripCount ?? 0) + (tripTodayCount ?? 0);

  return new Response(JSON.stringify({ expired: total }), {
    headers: { "Content-Type": "application/json" },
  });
});
