import { supabase } from "@/lib/supabaseClient";

/**
 * Upserts (inserts or increments) the daily tracker count for a user.
 *
 * @param userId Supabase auth.user.id
 * @param newCount Number of trackers to add for today (or set as today's total if mode="set")
 * @param mode "increment" (default) or "set" (overwrite today's value)
 */
export async function upsertDailyTrackerStat(
  userId: string | null,
  newCount: number,
  mode: "increment" | "set" = "increment"
) {
  if (!userId) {
    console.error("❌ No userId provided to upsertDailyTrackerStat. Aborting.");
    return;
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // 1. Check if today already has a row
  const { data: existing, error: selectError } = await supabase
    .from("daily_tracker_stats")
    .select("tracker_count")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  if (selectError) {
    console.error("❌ Error checking existing stat:", selectError.message);
    return;
  }

  // 2. If exists, increment. If not, start with newCount.
  //    If mode === "set", overwrite today's value with newCount.
  const total =
    mode === "set" ? newCount : existing ? existing.tracker_count + newCount : newCount;

  // 3. Upsert (insert or update)
  const { data, error: upsertError } = await supabase
    .from("daily_tracker_stats")
    .upsert(
      {
        user_id: userId,
        date: today,
        tracker_count: total,
      },
      { onConflict: "user_id,date" }
    )
    .select();

  if (upsertError) {
    console.error("❌ Error upserting daily stat:", upsertError.message, upsertError.details);
  }
}
