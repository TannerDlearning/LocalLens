import { supabase } from "@/lib/supabaseClient";

export interface DailyPoint {
  date: string;          // YYYY-MM-DD
  tracker_count: number;
}

export async function fetchDailyStats(userId: string): Promise<DailyPoint[]> {
  const { data, error } = await supabase
    .from("daily_tracker_stats")
    .select("date, tracker_count")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (error) {
    console.error("❌ Failed to fetch daily stats:", error.message);
    return [];
  }

  return (data ?? []) as DailyPoint[];
}
