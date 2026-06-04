import { supabase } from "@/lib/supabaseClient";

/**
 * Ensures the profile row exists for the user on login/signup.
 * This is called from your dashboard immediately after auth.
 */
export async function upsertProfile(userId: string, anonymousId: string) {
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id, anonymous_id")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) {
    console.error("❌ Profile lookup failed:", selectError);
    throw selectError;
  }

  if (existing) {
    // Only patch anonymous_id if missing
    if (!existing.anonymous_id) {
      await supabase
        .from("profiles")
        .update({ anonymous_id: anonymousId })
        .eq("id", userId);
    }
    return existing;
  }

  // Create full profile
  const { error: insertError } = await supabase.from("profiles").insert({
    id: userId,
    anonymous_id: anonymousId,
    is_premium: false,
    revoke_count: 0,
  });

  if (insertError) {
    console.error("❌ Profile insert failed:", insertError);
    throw insertError;
  }
}
