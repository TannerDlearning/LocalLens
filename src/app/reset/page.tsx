"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GalleryVerticalEnd, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/reset/confirm`, // Supabase will send user here to finish reset
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Password reset email sent. Check your inbox.");
    }

    setLoading(false);
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Logo / home link */}
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          LocalLens
        </Link>
        {/* Form */}
        <form onSubmit={handleResetRequest} className="grid gap-4">
          <div className="grid gap-2 text-center">
            <h1 className="text-2xl font-semibold">Reset your password</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and we’ll send you a link to reset it.
            </p>
          </div>

          <div className="grid gap-2">
            <Label className="" htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Error and success messages */}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send Reset Link
          </Button>
        </form>

        {/* Back to login */}
        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="underline underline-offset-4 hover:text-foreground cursor-pointer">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
