"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import NotificationSettings from "./NotificationSettings";

export default function Navbar({ extensionDetected = false }) {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const startActionTimeoutToast = (ms = 12000) => {
    const id = window.setTimeout(() => {
      toast.warning("That’s taking longer than expected — try refreshing the page and trying again.");
    }, ms);

    return () => window.clearTimeout(id);
  };

  const withTimeout = async <T,>(p: Promise<T>, ms: number) => {
    let t: ReturnType<typeof setTimeout> | null = null;
    try {
      return await Promise.race([
        p,
        new Promise<T>((_, reject) => {
          t = setTimeout(() => reject(new Error("timed out")), ms);
        }),
      ]);
    } finally {
      if (t) clearTimeout(t);
    }
  };

  function clearLocalLensClientState() {
    const prefixes = ["pt:", "permissionTrail", "loglevel"];

    for (const key of Object.keys(localStorage)) {
      if (prefixes.some((p) => key.startsWith(p))) {
        localStorage.removeItem(key);
      }
    }
  }

  function clearPerUserSyncKeys() {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("pt:lastSyncedISO:")) localStorage.removeItem(key);
      if (key.startsWith("permissionTrailAnonId_")) localStorage.removeItem(key);
    }
  }

  const handleSignOut = async () => {
    setNotifOpen(false);
    clearLocalLensClientState();
    clearPerUserSyncKeys();

    try {
      await withTimeout(supabase.auth.signOut(), 8000);
    } catch (e) {
      console.warn("Sign out failed or timed out:", e);
      toast.error("Logout didn’t complete cleanly. Please try again.");
    }
  };

  const firstInitial =
    user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "U";

  return (
    <>
      <nav className="w-full fixed top-0 left-0 z-50 px-[var(--space-lg)] py-4 bg-background/60 backdrop-blur-md shadow-sm flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center gap-[5px] hover:opacity-90 transition-opacity"
          aria-label="Go to homepage"
        >
          <Image
            src="/logo-icon.png"
            alt="LocalLens logo"
            width={48}
            height={48}
            unoptimized
            className="cursor-pointer"
          />
          <span className="text-xl font-bold tracking-tight hidden sm:inline">
            LocalLens
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle dark mode"
            className="relative inline-flex h-6 w-11 items-center rounded-full border border-border bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
          >
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-sm transition-transform duration-200 ${
                mounted && theme === "dark" ? "translate-x-5" : "translate-x-0.5"
              }`}
            >
              {mounted && theme === "dark" ? (
                <Moon size={11} className="text-foreground" />
              ) : (
                <Sun size={11} className="text-foreground" />
              )}
            </span>
          </button>

          {extensionDetected && (
            <>
            {user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <div className="relative inline-block">
                    <Avatar className="cursor-pointer">
                      <AvatarImage src={undefined} />
                      <AvatarFallback className="bg-sky-600 text-white">
                        {firstInitial}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault();
                      setNotifOpen(true);
                    }}
                  >
                    Notification Settings
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="cursor-pointer text-red-600"
                    onClick={handleSignOut}
                  >
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="outline" size="sm" className="font-medium cursor-pointer">
                    Create Account
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="sm" className="font-medium cursor-pointer">
                    Log In
                  </Button>
                </Link>
              </>
            )}
            </>
          )}
        </div>
      </nav>

      <NotificationSettings open={notifOpen} setOpen={setNotifOpen} />
    </>
  );
}
