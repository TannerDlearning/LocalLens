"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { upsertDailyTrackerStat } from "../lib/upsertDailyStat";
import { fetchDailyStats, DailyPoint } from "../lib/fetchDailyStats";
import { Button } from "./ui/button";

import { ChartAreaInteractive } from "../components/chart-area-interactive";
import { DataTable } from "../components/data-table";
import { SectionCards } from "../components/section-cards";

import { aggregateData } from "../lib/aggregateData";
import { calculateTrustScore } from "../lib/calculateTrustScore";

import { SectionCardsSkeleton } from "./skeletons/SectionCardsSkeleton";
import { ChartAreaSkeleton } from "./skeletons/ChartAreaSkeleton";
import { DataTableSkeleton } from "./skeletons/DataTableSkeleton";
import Footer from "./Footer";
import { ShieldCheck, Eye } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePathname } from "next/navigation";

import { PermissionRecord } from "../types/permission";

// ⭐ NEW: toggle UI
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// helpers
function migrateOldSyncKeys(userId: string) {
  // old patterns to delete
  const prefixes = [`pt:sync:${userId}:`, `ptsync:${userId}:`];

  let newestISO: string | null = null;

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (!k) continue;

    const matches = prefixes.some((p) => k.startsWith(p));
    if (!matches) continue;

    const v = localStorage.getItem(k);
    if (v && (!newestISO || v > newestISO)) newestISO = v;

    localStorage.removeItem(k);
  }

  // if we found an old marker and the new single-key marker isn't set, set it
  const newKey = `pt:lastSyncedISO:${userId}`;
  if (newestISO && !localStorage.getItem(newKey)) {
    localStorage.setItem(newKey, newestISO);
  }
}
const todayStr = () => new Date().toISOString().slice(0, 10);
const countItems = (r: any) =>
  (r.cookies?.length ?? 0) +
  Object.keys(r.local_storage ?? {}).length +
  (r.indexeddb?.length ?? 0);

function countUniqueNewTrackers(records: any[]) {
  const cookies = new Set<string>();
  const lsKeys = new Set<string>();
  const idbs = new Set<string>();

  for (const r of records) {
    for (const c of r.cookies ?? []) {
      cookies.add(`${c.name}@@${c.domain ?? ""}`);
    }
    for (const k of Object.keys(r.local_storage ?? {})) {
      lsKeys.add(k);
    }
    for (const db of r.indexeddb ?? []) {
      idbs.add(`${db.name}@@${String(db.version ?? "")}`);
    }
  }

  return cookies.size + lsKeys.size + idbs.size;
}

const Hero = () => (
  <div className="flex flex-col gap-[var(--space-lg)] w-full">
    <div className="flex gap-[var(--space-lg)] items-center sm:text-start">
      <h1 className="text-2xl sm:text-4xl font-bold">
        Know what’s stored. Take control.
      </h1>
      <ShieldCheck size={28} strokeWidth={3} className="hidden sm:inline" />
    </div>
    <div className="text-lg text-muted-foreground">
      <h2 className="hidden sm:block">
        Track cookies, storage, and hidden data—right in your browser.
      </h2>
      <h2 className="hidden sm:block">
        No surprises. No hidden tracking. Privacy-first.
      </h2>
      <h2 className="sm:hidden">See what websites store on your device.</h2>
      <h2 className="sm:hidden">No hidden tracking.</h2>
    </div>
    <div className="flex gap-[var(--space-md)]">
      <Badge className="" variant="secondary">
        Privacy-first <ShieldCheck />
      </Badge>
      <Badge className="" variant="secondary">
        Full transparency <Eye />
      </Badge>
    </div>
  </div>
);

interface DashboardProps {
  isLoading?: boolean;
}

const postAuthStatus = (loggedIn: boolean) => {
  window.postMessage(
    {
      source: "LocalLens Dev",
      type: "AUTH_STATUS",
      loggedIn,
      isPremium: loggedIn,
    },
    "*"
  );
};

export default function Dashboard({ isLoading = false }: DashboardProps) {
  const { user, loggedIn, userId, loading } = useAuth();
  const [rawData, setRawData] = useState<PermissionRecord[] | undefined>(
    undefined
  );
  const [history, setHistory] = useState<DailyPoint[]>([]);
  const fetchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ⭐ NEW: exclusion list + mode
  const [excludedWebsites, setExcludedWebsites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"tracked" | "excluded">("tracked");

  // NEW: email verification state
  const [needsVerification, setNeedsVerification] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null); // for no-session-after-signup
  const [resending, setResending] = useState(false);

  // Load pending email saved during signup (when there is no session yet)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pendingEmailVerification");
      if (stored) setPendingEmail(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const pathname = usePathname();

  // ✅ VERIFICATION effect
  useEffect(() => {
    if (pathname !== "/") return;

    // ---------- verification banner ----------
    if (!user) {
      setUserEmail(null);
      setNeedsVerification(Boolean(pendingEmail));
    } else {
      const provider = user?.app_metadata?.provider;
      const emailVerified =
        Boolean(user?.email_confirmed_at) || Boolean(user?.confirmed_at);

      setUserEmail(user.email ?? null);

      const needs = provider === "email" && !emailVerified;
      setNeedsVerification(needs);

      if (!needs) {
        try {
          localStorage.removeItem("pendingEmailVerification");
        } catch {
          /* ignore */
        }
        setPendingEmail(null);
      }
    }
  }, [pathname, pendingEmail, user]);

  // Post auth status to extension
  useEffect(() => {
    postAuthStatus(loggedIn);
  }, [loggedIn]);

  // Resend verification email (works with either a logged-in unverified user
  // or a fresh signup with only pending email stored)
  const resendVerification = async () => {
    const targetEmail = userEmail ?? pendingEmail;
    if (!targetEmail) return;

    try {
      setResending(true);
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: targetEmail,
      });
      if (error) console.error("Resend error:", error);
    } catch (e) {
      console.error(e);
    } finally {
      setResending(false);
    }
  };

  // NEW: retry state
  const retryTimerRef = useRef<number | null>(null);
  const retryAttemptsRef = useRef(0);

  useEffect(() => {
    if (pathname !== "/") return;

    const REQUEST = () =>
      window.postMessage(
        { source: "LocalLens Dev", type: "REQUEST_ALL_RECORDS" },
        "*"
      );

    const stopRetry = () => {
      if (retryTimerRef.current) {
        clearInterval(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };

    // ✅ less aggressive retry: 3 attempts, 800ms spacing
    const startRetry = () => {
      stopRetry();
      retryAttemptsRef.current = 0;

      retryTimerRef.current = window.setInterval(() => {
        retryAttemptsRef.current += 1;
        REQUEST();

        if (retryAttemptsRef.current >= 3) {
          stopRetry();
        }
      }, 800);
    };

    const handleMessage = (event: MessageEvent) => {
      if (
        event.data?.source !== "LocalLens Extension" &&
        event.data?.source !== "LocalLens Dev"
      ) {
        console.log("Ignored message from unknown source:", event.data);
        return;
      }

      const { type, records, websites } = event.data as {
        type: string;
        records?: PermissionRecord[];
        websites?: string[];
      };

      if (type === "ALL_RECORDS_RESPONSE") {
        stopRetry();
        setRawData(records || []);
      }

      if (type === "EXCEPTIONS_UPDATED") {
        const updated = (event.data as any).websites ?? [];
        setExcludedWebsites(() => websites || []);

        // refresh tracked data so UI updates
        window.postMessage(
          { source: "LocalLens Dev", type: "REQUEST_ALL_RECORDS" },
          "*"
        );
      }

      if (type === "REVOKE_CONFIRM" || type === "REVOKE_BULK_CONFIRM") {
        if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
        fetchTimeout.current = setTimeout(() => {
          REQUEST();
          startRetry();
        }, 300);
      }
    };

    window.addEventListener("message", handleMessage);

    window.postMessage(
      { source: "LocalLens Dev", type: "REQUEST_EXCEPTIONS" },
      "*"
    );

    // ✅ simple kickoff: request now + retry; also run on pageshow
    REQUEST();
    startRetry();

    const onPageShow = () => {
      REQUEST();
      startRetry();
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("pageshow", onPageShow);
      stopRetry();
      if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
    };
  }, [pathname]);

  // aggregate for cards + table
  const aggregated = aggregateData(
    (rawData || []).map((record) => ({
      ...record,
      root_url: (record as any).root_url ?? "",
      created_at: (record as any).created_at ?? new Date().toISOString(),
      indexeddb: (record.indexeddb || []).map((db: any) => ({
        name: db.name,
        version: String(db.version),
      })),
      form_data: Array.isArray(record.form_data)
        ? record.form_data.map((fd: any) =>
          typeof fd === "string"
            ? fd
            : typeof fd === "object"
              ? Object.values(fd).join(" ")
              : ""
        )
        : [],
    })),
    calculateTrustScore
  );

  const PROTECTED = [
    "https://locallens.local",
    "https://www.locallens.local",
  ];

  const trackedRows = aggregated.filter(
    (row) =>
      !excludedWebsites.includes(row.root_url) &&
      !PROTECTED.includes(row.root_url)
  );

  const excludedRows = aggregated.filter(
    (row) => excludedWebsites.includes(row.root_url) || PROTECTED.includes(row.root_url)
  );

  useEffect(() => {
    (async () => {
      if (!rawData) return;

      // ✅ use already-known userId (no extra supabase call)
      if (!userId) return;

      migrateOldSyncKeys(userId);

      const today = new Date().toISOString().slice(0, 10);
      const syncKey = `pt:lastSyncedISO:${userId}`;
      const lastSyncISO = localStorage.getItem(syncKey);
      const baselineISO = `${today}T00:00:00.000Z`;
      const lastISO = lastSyncISO || baselineISO;

      // Always fetch stats so the chart shows current history
      const stats = await fetchDailyStats(userId);
      setHistory(stats);

      // Only consider NEW records since last sync (today only)
      const newOnes = rawData.filter(
        (r) => r.created_at.slice(0, 10) === today && r.created_at > lastISO
      );

      if (newOnes.length === 0) return;

      const delta = countUniqueNewTrackers(newOnes);
      if (delta > 0) {
        await upsertDailyTrackerStat(userId, delta, "increment");

        const latestISO = newOnes
          .map((r) => r.created_at)
          .reduce((a, b) => (a > b ? a : b), lastISO);
        localStorage.setItem(syncKey, latestISO);

        const statsAfter = await fetchDailyStats(userId);
        setHistory(statsAfter);
      }
    })();
  }, [rawData, userId]); // ✅ include userId so it runs once auth is ready

  return (
    <div className="flex w-full justify-center min-h-screen pt-[var(--space-5xl)] pb-[var(--space-3xl)]">
      <div className="flex w-full max-w-[1280px] flex-col gap-[var(--space-3xl)] px-[var(--space-lg)]">
        {needsVerification && (
          <Alert variant="destructive">
            <AlertTitle>Email verification required</AlertTitle>
            <AlertDescription className="mt-2 flex flex-wrap items-center gap-3">
              {`Please check your inbox and click the link to verify your account${userEmail ?? pendingEmail
                  ? ` for ${userEmail ?? pendingEmail}`
                  : ""
                }.`}
              {(userEmail ?? pendingEmail) && (
                <Button
                  className=""
                  size="sm"
                  variant="outline"
                  onClick={resendVerification}
                  disabled={resending}
                >
                  {resending ? "Sending..." : "Resend email"}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Hero />

        <div className="w-full rounded-xl shadow-md border bg-card overflow-hidden flex">
          <div className="flex flex-col w-full">
            <div className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                  {/* Section Cards */}
                  {rawData === undefined ? (
                    <SectionCardsSkeleton />
                  ) : (
                    <SectionCards data={trackedRows} />
                  )}

                  {/* Chart */}
                  {rawData === undefined ? (
                    <ChartAreaSkeleton />
                  ) : (
                    <div className="px-4 lg:px-6">
                      <ChartAreaInteractive data={history} />
                    </div>
                  )}

                  {/* Tabs + Table */}
                  <div className="flex flex-col">
                    <div className="px-4 lg:px-6">
                      <Tabs
                        value={viewMode}
                        onValueChange={(mode: "tracked" | "excluded") =>
                          setViewMode(mode)
                        }
                        className="w-full"
                      >
                        <TabsList className="w-fit">
                          <TabsTrigger className="cursor-pointer" value="tracked">
                            Tracked Websites
                          </TabsTrigger>
                          <TabsTrigger className="cursor-pointer" value="excluded">
                            Excluded Websites
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    <div className="px-4 lg:px-6">
                      {rawData === undefined ? (
                        <DataTableSkeleton />
                      ) : (
                        <DataTable
                          data={viewMode === "tracked" ? trackedRows : excludedRows}
                          mode={viewMode}
                          excludedWebsites={excludedWebsites}
                          authStatus={{ loggedIn }}
                          userId={userId}
                          loading={loading}
                          refreshData={() =>
                            window.postMessage(
                              {
                                source: "LocalLens Dev",
                                type: "REQUEST_ALL_RECORDS",
                              },
                              "*"
                            )
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="" />
        <Footer />
      </div>
    </div>
  );
}
