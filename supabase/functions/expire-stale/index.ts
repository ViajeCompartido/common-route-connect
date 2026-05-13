import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const argentinaDateTime = (date: Date) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
    return {
      date: `${part("year")}-${part("month")}-${part("day")}`,
      time: `${part("hour")}:${part("minute")}:${part("second")}`,
    };
  };

  const now = new Date();
  const today = argentinaDateTime(now).date;
  const cutoff = argentinaDateTime(new Date(now.getTime() - 40 * 60 * 1000));

  // Expire ride requests older than 40 minutes past departure
  const { count: reqCount } = await supabase
    .from("ride_requests")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("date", today)
    .select("id", { count: "exact", head: true });

  // Also expire same-day requests where time + 40min has passed
  const { count: reqTodayCount } = await supabase
    .from("ride_requests")
    .update({ status: "expired" })
    .eq("status", "active")
    .eq("date", cutoff.date === today ? today : "0001-01-01")
    .lt("time", cutoff.time)
    .select("id", { count: "exact", head: true });

  // Expire trips without treating them as manually cancelled.
  const { count: tripCount } = await supabase
    .from("trips")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("date", today)
    .select("id", { count: "exact", head: true });

  const { count: tripTodayCount } = await supabase
    .from("trips")
    .update({ status: "expired" })
    .eq("status", "active")
    .eq("date", cutoff.date === today ? today : "0001-01-01")
    .lt("time", cutoff.time)
    .select("id", { count: "exact", head: true });

  const total =
    (reqCount ?? 0) + (reqTodayCount ?? 0) + (tripCount ?? 0) + (tripTodayCount ?? 0);

  return new Response(JSON.stringify({ expired: total }), {
    headers: { "Content-Type": "application/json" },
  });
});
