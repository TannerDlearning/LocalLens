import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const timeoutMs = 12_000;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(t));
}

declare global {
  // eslint-disable-next-line no-var
  var __pt_supabase__: SupabaseClient | undefined;
}

export const supabase =
  globalThis.__pt_supabase__ ??
  createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    global: { fetch: fetchWithTimeout },
  });

if (process.env.NODE_ENV !== "production") globalThis.__pt_supabase__ = supabase;

if (typeof window !== "undefined") {
  // @ts-ignore
  window.supabase = supabase;
}

/**
 * Manually refresh the session if refresh token is invalid/expired
 * This is called when we detect a "Refresh Token Not Found" error
 */
export async function refreshSessionIfNeeded() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.refresh_token) {
      console.warn("⚠️ No refresh token available, cannot refresh session");
      return false;
    }

    console.log("Attempting to manually refresh session...");
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: session.refresh_token,
    });

    if (error) {
      console.error("❌ Failed to refresh session:", error.message);
      // Clear the invalid session
      await supabase.auth.signOut();
      return false;
    }

    return true;
  } catch (err) {
    console.error("❌ Error during session refresh:", err);
    return false;
  }
}