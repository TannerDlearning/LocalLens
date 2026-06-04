"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import { upsertProfile } from "@/lib/upsertProfile";

function AuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const anon = params.get("anon") || undefined;

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      const userId = data.user.id;

      // NEW: Key the anon ID PER ACCOUNT
      const anonKey = `permissionTrailAnonId_${userId}`;

      let anonymousId =
        anon ||
        localStorage.getItem(anonKey) ||
        crypto.randomUUID();

      localStorage.setItem(anonKey, anonymousId);

      try {
        await upsertProfile(userId, anonymousId);
      } catch (err) {
        console.error("❌ Profile upsert failed:", err);
      }

      router.replace("/");
    })();
  }, [router, anon]);


  return (
    <div className="flex h-screen items-center justify-center">
      <p>Finishing sign-in, please wait...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><p>Loading...</p></div>}>
      <AuthCallbackInner />
    </Suspense>
  );
}
