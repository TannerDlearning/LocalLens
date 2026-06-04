"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { supabase, refreshSessionIfNeeded } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type Mode = "login" | "signup";

interface AuthFormProps {
  mode: Mode;
  redirectTo?: string; // where to go after success (e.g. "/dashboard")
}

function AuthFormInner({ mode, redirectTo = "/" }: AuthFormProps) {
  const router = useRouter();
  const params = useSearchParams();
  const anonFromQuery = params.get("anon") || undefined;

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const callbackUrl = `${baseUrl}/auth/callback${anonFromQuery ? `?anon=${encodeURIComponent(anonFromQuery)}` : ""
    }`;

  const authHandlers = {
    async handleSignup(email: string, password: string) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callbackUrl },
      });

      if (error) {
        console.error('[AUTH] Signup error:', error);
        throw new Error(error.message);
      }

      return data;
    },

    async handleSignIn(email: string, password: string) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AUTH] Signin error:', error);
        throw new Error(error.message);
      }

      if (!data.user?.id) {
        throw new Error('Invalid credentials');
      }

      return data.user;
    }
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      let user;

      if (mode === "login") {
        user = await authHandlers.handleSignIn(email, password);

        router.push(redirectTo.startsWith("http") ? redirectTo : `${baseUrl}${redirectTo}`);

      } else {
        const data = await authHandlers.handleSignup(email, password);
        if (data?.user) {
          if (data.user.identities && data.user.identities.length === 0) {
            setErrorMsg("Email already taken. Please log in instead.");
          }
          else if (!data.session) {
          setErrorMsg("Signup successful. Please check your email to confirm your account before logging in.");
          return;
        }
        }
        
        //router.push(redirectTo.startsWith("http") ? redirectTo : `${baseUrl}${redirectTo}`);
      }

    } catch (err: any) {
      const detailedMessage =
        err?.error_description ||
        err?.error?.message ||
        err?.message ||
        err?.response?.error_description ||
        err?.response?.message ||
        (err?.status === 504
          ? "The server took too long to respond. If you just enabled custom email, it may take a few minutes for SMTP setup to complete."
          : "An unexpected error occurred during authentication.");
      const status = err?.status || err?.error?.status || err?.response?.status;
      setErrorMsg(status ? `[${status}] ${detailedMessage}` : detailedMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Google sign-in error:", err);

      const detailedMessage =
        err?.error_description ||
        err?.error?.message ||
        err?.message ||
        err?.response?.message ||
        "Google sign-in failed. Please try again later.";

      const status = err?.status || err?.error?.status || err?.response?.status;
      setErrorMsg(status ? `[${status}] ${detailedMessage}` : detailedMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label className="" htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="grid gap-2">
        <Label className="" htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          placeholder="••••••••"
        />
      </div>

      {errorMsg && <p className="text-sm text-red-600 whitespace-pre-line">{errorMsg}</p>}

      <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === "login" ? "Sign in" : "Create account"}
      </Button>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full cursor-pointer"
        onClick={handleGoogle}
        disabled={loading}
      >
        Continue with Google
      </Button>
    </form>
  );
}

export function AuthForm(props: AuthFormProps) {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading form...</div>}>
      <AuthFormInner {...props} />
    </Suspense>
  );
}

// async function ensureProfile(userId: string, anonymousId?: string) {
//   console.log(`[PROFILE] Ensuring profile for userId=${userId} with anonymousId=${anonymousId}`);
//   const { data: existing } = await supabase
//     .from("profiles")
//     .select("id, anonymous_id")
//     .eq("id", userId)
//     .maybeSingle();

//   if (!existing) {
//     console.log(`[PROFILE] No existing profile found for userId=${userId}. Creating new profile.`);
//     await supabase.from("profiles").insert({
//       id: userId,
//       anonymous_id: anonymousId ?? null,
//       is_premium: false,
//       created_at: new Date().toISOString(),
//       revoke_count: 0,
//       stripe_customer_id: null,
//     });
//   } else if (anonymousId && !existing.anonymous_id) {
//     console.log(`[PROFILE] Existing profile found for userId=${userId} but no anonymous_id. Updating profile with anonymousId=${anonymousId}.`);
//     await supabase
//       .from("profiles")
//       .update({ anonymous_id: anonymousId })
//       .eq("id", userId);
//   }
// }
