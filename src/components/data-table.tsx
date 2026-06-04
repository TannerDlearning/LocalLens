"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  useReactTable,
  ColumnMeta,
} from "@tanstack/react-table";
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import Image from "next/image";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends unknown, TValue> {
    label?: string;
  }
}

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { ScrollArea } from "../components/ui/scroll-area";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

import { ChevronDown, Info, ArrowUpDown, Loader2Icon, Copy, Settings } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";


import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

// 🔑 Row data type for the table
export interface TableRecord {
  id: string;
  root_url: string;
  trackers: number;
  stored_data_types: number;
  workers: number;
  trust_score: number | string;
  cookie_count: number;
  local_storage_count: number;
  indexeddb_count: number;
  cache_storage_count: number;
  service_worker_count: number;
  form_data_count: number;
  created_at: string | null;
  ids: string[];
}

interface DataTableProps {
  data: TableRecord[];
  refreshData: () => void;
  mode?: "tracked" | "excluded";
  excludedWebsites?: string[];
  authStatus: { loggedIn: boolean; isPremium: boolean };
  userId: string | null;
  loading: boolean;
}

export function DataTable({
  data,
  refreshData,
  authStatus,
  userId,
  mode = "tracked",
  excludedWebsites = [],
  loading,
}: DataTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const pendingRevokeRef = React.useRef<(() => void) | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] =
    React.useState<RowSelectionState>({});

  const [loadingRevokeId, setLoadingRevokeId] =
    React.useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = React.useState(false);
  const bulkRevokeTimeoutRef = React.useRef<number | null>(null);

  const [analyticsLoadingToastId, setAnalyticsLoadingToastId] = React.useState<string | number | null>(null);

  const [showPremiumModal, setShowPremiumModal] = React.useState(false);
  const [premiumModalText, setPremiumModalText] = React.useState("");

  // Keep the current user in state so auth doesn’t flap between calls
  const [user, setUser] = React.useState<any>(null);

  // Premium analytics dialog state
  const [analyticsOpen, setAnalyticsOpen] = React.useState(false);
  const [analyticsTarget, setAnalyticsTarget] = React.useState<string | null>(null);

  const [details, setDetails] = React.useState<{
    origin: string;
    cookies: { name: string; domain?: string }[];
    localStorage: Record<string, string>;
    indexedDb: { name: string; version?: string }[];
    indexedDbDetails: {
      dbName: string;
      version?: number;
      stores: { storeName: string; rows: { key: string; value: string }[] }[];
    }[];
    cacheStorage: string[];
    serviceWorkers: string[];
    formData: string[];
  } | null>(null);


  //USE EFFECTS

  React.useEffect(() => {
    return () => {
      if (bulkRevokeTimeoutRef.current) {
        clearTimeout(bulkRevokeTimeoutRef.current);
        bulkRevokeTimeoutRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    const onMsg = (event: MessageEvent) => {
      if (event.data?.source !== "LocalLens Extension") return;

      if (event.data?.type === "DOMAIN_DETAILS_RESPONSE") {
        const payload = event.data?.payload;
        if (!payload?.origin) return;

        //only accept if it matches the current requested origin
        if (analyticsTarget && payload.origin !== analyticsTarget) return;

        setDetails({
          origin: payload.origin,
          cookies: payload.cookies ?? [],
          localStorage: payload.localStorage ?? {},
          indexedDb: payload.indexedDb ?? [],
          indexedDbDetails: payload.indexedDbDetails ?? [],
          cacheStorage: payload.cacheStorage ?? [],
          serviceWorkers: payload.serviceWorkers ?? [],
          formData: payload.formData ?? [],
        });
        if (analyticsLoadingToastId !== null) {
          toast.dismiss(analyticsLoadingToastId);
        }
        setAnalyticsOpen(true);
      }

      if (event.data?.type === "DOMAIN_DETAILS_ERROR") {
        toast.error("Could not load advanced analytics for this site.");
      }
    };

    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [analyticsTarget]);


  //HELPER FUNCTIONS

  const withTimeout = async <T,>(
    promiseLike: PromiseLike<T>,
    ms: number,
    label: string
  ): Promise<T> => {
    const promise = Promise.resolve(promiseLike);
    let t: ReturnType<typeof setTimeout> | null = null;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          t = setTimeout(
            () => reject(new Error(`${label} timed out after ${ms}ms`)),
            ms
          );
        }),
      ]);
    } finally {
      if (t) clearTimeout(t);
    }
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const isLikelyNetworkOrTimeout = (e: any) => {
    const msg = String(e?.message ?? e ?? "");
    return (
      msg.includes("timed out") ||
      msg.includes("Failed to fetch") ||
      msg.includes("NetworkError") ||
      msg.includes("fetch")
    );
  };

  type Severity = "Low" | "Medium" | "High";

  const severityWeights = {
    cookies: 1,
    localStorage: 2,
    indexedDb: 3,
    cache: 1,
    serviceWorkers: 10,
    formData: 4,
  } as const;

  function severityFromCount(group: keyof typeof severityWeights, count: number): Severity {
    const w = severityWeights[group];
    const score = count * w;

    if (score === 0) return "Low";
    if (score <= 8) return "Low";
    if (score <= 18) return "Medium";
    return "High";
  }

  function severityBadge(sev: Severity) {
    if (sev === "High") return <Badge variant="destructive">High</Badge>;
    if (sev === "Medium") return <Badge variant="warning">Medium</Badge>;
    return <Badge variant="outline">Low</Badge>;
  }

  const formatTableDataForCopy = (type: string): string => {
    if (!details) return "";

    let text = "";

    switch (type) {
      case "cookies":
        if (details.cookies && details.cookies.length > 0) {
          text = details.cookies.map((c) => c.name).join("\n");
        }
        break;

      case "localstorage":
        if (details.localStorage) {
          text = Object.entries(details.localStorage)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n");
        }
        break;

      case "indexeddb": {
        // ✅ Prefer the deep dump (db -> store -> rows)
        const dump = details.indexedDbDetails ?? [];

        if (dump.length > 0) {
          const lines: string[] = [];

          dump.forEach((db) => {
            lines.push(`Database: ${db.dbName}${typeof db.version === "number" ? ` (v${db.version})` : ""}`);

            (db.stores ?? []).forEach((store) => {
              lines.push(`  Store: ${store.storeName}`);

              const rows = store.rows ?? [];
              if (rows.length === 0) {
                lines.push(`    (no rows)`);
              } else {
                rows.forEach((r) => {
                  // keep it readable and still copyable
                  const key = (r.key ?? "").toString();
                  const value = (r.value ?? "").toString();
                  lines.push(`    ${key}: ${value}`);
                });
              }
            });

            lines.push(""); // blank line between DBs
          });

          text = lines.join("\n").trim();
          break;
        }

        // ✅ Fallback: if dump isn't available, copy DB names as before
        if (details.indexedDb && details.indexedDb.length > 0) {
          text = details.indexedDb
            .map((db) => db.name + (db.version ? ` (v${db.version})` : ""))
            .join("\n");
        }
        break;
      }

      case "cache":
        if (details.cacheStorage && details.cacheStorage.length > 0) {
          text = details.cacheStorage.join("\n");
        }
        break;

      case "workers":
        if (details.serviceWorkers && details.serviceWorkers.length > 0) {
          text = details.serviceWorkers.join("\n");
        }
        break;

      case "forms":
        if (details.formData && details.formData.length > 0) {
          text = details.formData.join("\n");
        }
        break;
    }

    return text;
  };

  const handleCopyTableData = (type: string) => {
    const text = formatTableDataForCopy(type);
    if (!text) {
      toast.error("No data to copy");
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard");
    }).catch(() => {
      toast.error("Failed to copy to clipboard");
    });
  };

  const requestDomainDetails = (row: TableRecord) => {
    if (!authStatus?.loggedIn) {
      toast.error("Please log in to view advanced analytics.");
      return;
    }



    if (!authStatus?.isPremium) {
      toast.error("Advanced analytics requires a Premium subscription.");
      setShowPremiumModal(false);
      setPremiumModalText("Advanced analytics is a Premium feature. Upgrade now to unlock detailed insights about the trackers and data stored by each website.");
      requestAnimationFrame(() => setShowPremiumModal(true));
      return;
    }

    const analyticsLoadingToastId = toast.loading("Loading advanced analytics...");
    setAnalyticsLoadingToastId(analyticsLoadingToastId);

    setAnalyticsTarget(row.root_url);
    setDetails(null);

    window.postMessage(
      {
        source: "LocalLens Dev",
        type: "REQUEST_DOMAIN_DETAILS",
        origin: row.root_url,
        ids: row.ids,
      },
      "*"
    );
  };

  const canRevoke = async (amountToRevoke: number): Promise<boolean> => {
    if (!authStatus?.loggedIn || !userId) {
      toast.error("Please log in to revoke trackers.");
      return false;
    }

    if (loading) {
      toast.error("Please wait for account to load.");
      return false;
    }

    if (authStatus?.isPremium) return true;

    const FREE_LIMIT = 5;

    // Fetch profile to check revoke count
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id,is_premium,revoke_count")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile) {
      toast.error("Could not check your account. Please try again.");
      return false;
    }

    const current = profile.revoke_count ?? 0;
    if (current + amountToRevoke > FREE_LIMIT) {
      toast.error("Free revoke limit reached. Upgrade to Premium.");
      setPremiumModalText("You've reached the free limit of 5 revokes. Upgrade to Premium for unlimited control.");
      requestAnimationFrame(() => setShowPremiumModal(true));
      return false;
    }
    return true;
  };


  const incrementRevokeCount = async () => {
    if (!userId) return;

    // ✅ Premium: don’t touch Supabase at all
    if (authStatus?.isPremium) return;

    // ✅ Still update DB, but now it cannot hang forever because client has fetch timeout
    const { error: rpcErr } = await supabase.rpc("increment_revoke_count", { uid: userId });

    if (rpcErr) {
      // fallback: only if needed
      const { data: p } = await supabase
        .from("profiles")
        .select("revoke_count")
        .eq("id", userId)
        .maybeSingle();

      const current = p?.revoke_count ?? 0;

      await supabase.from("profiles")
        .update({ revoke_count: current + 1 })
        .eq("id", userId);
    }
  };


  // =============================================================
  // ⭐ NEW: Add To Exceptions handler
  // =============================================================

  const handleAddToExceptions = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length === 0) return;
    if (!authStatus?.loggedIn) {
      toast.error("Please log in to add sites to exceptions.");
      return;
    }

    const websites = selectedRows.map(
      (r) => r.original.root_url
    );

    window.postMessage(
      {
        source: "LocalLens Dev",
        type: "ADD_TO_EXCEPTIONS",
        websites,
      },
      "*"
    );

    toast.success(`${websites.length} site(s) added to exclusions`);

    table.resetRowSelection();
  };

  const handleRemoveFromExceptions = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length === 0) return;

    const websites = selectedRows.map((r) => r.original.root_url);

    window.postMessage(
      {
        source: "LocalLens Dev",
        type: "REMOVE_FROM_EXCEPTIONS",
        websites, // always array
      },
      "*"
    );

    toast.success(`Tracking resumed for ${websites.length} site(s)`);

    table.resetRowSelection();
  };

  // =============================================================

  const columns: ColumnDef<TableRecord>[] = [
    {
      id: "select",
      header: ({ table }) => {
        const selectableRows = table
          .getRowModel()
          .rows.filter(
            (r) =>
              r.original.root_url !== "https://locallens.local" &&
              r.original.root_url !== "https://www.locallens.local"
          );

        const allSelectableSelected =
          selectableRows.length > 0 &&
          selectableRows.every((r) => r.getIsSelected());

        const someSelectableSelected =
          selectableRows.some((r) => r.getIsSelected()) &&
          !allSelectableSelected;

        return (
          <input
            className="cursor-pointer"
            type="checkbox"
            checked={allSelectableSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelectableSelected;
            }}
            onChange={(e) => {
              selectableRows.forEach((r) =>
                r.toggleSelected(e.target.checked)
              );
            }}
            title="Select all rows"
          />
        );
      },
      cell: ({ row }) => {
        if (
          row.original.root_url === "https://locallens.local"
        ) {
          return null;
        }

        return (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            title="Select row"
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },

    // ========= OTHER COLUMNS UNCHANGED ========= //

    {
      accessorKey: "root_url",
      header: "Website",
      meta: { label: "Website" },
      cell: ({ row }) => (
        row.original.root_url
      ),
    },

    {
      accessorKey: "trackers",
      meta: { label: "Trackers" },
      header: "Trackers",
      cell: ({ row }) => {
        const { root_url, trackers, ids } = row.original;

        if (
          root_url === "https://locallens.local" ||
          root_url === "https://www.locallens.local"
        ) {

          if (Array.isArray(ids)) {
            return ids.filter(
              (id) => typeof id === "string" && !id.startsWith("pt")
            ).length;
          }
        }

        return trackers;
      },
    },
    {
      accessorKey: "stored_data_types",
      meta: { label: "Stored Data Types" },
      header: "Stored Data Types",
      cell: ({ row }) => (
        authStatus?.loggedIn ? (
          <span>{row.original.stored_data_types}</span>
        ) : (
          <div className="flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Image
                  unoptimized
                  src="/padlock_icon.png"
                  alt="Create an account to see this data"
                  width={24}
                  height={24}
                />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-left whitespace-pre-wrap">
                <p>
                  {"Create a free account to view stored data types"}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )
      ),
    },

    {
      accessorKey: "workers",
      meta: { label: "Workers" },
      header: "Workers",
      cell: ({ row }) => (
        authStatus?.loggedIn ? (
          <span>{row.original.workers}</span>
        ) : (
          <div className="flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Image
                  unoptimized
                  src="/padlock_icon.png"
                  alt="Create an account to see this data"
                  width={24}
                  height={24}
                />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-left whitespace-pre-wrap">
                <p>
                  {"Create a free account to view workers"}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )
      ),
    },

    {
      accessorKey: "trust_score",
      meta: { label: "Trust Score" },
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="mx-auto flex items-center gap-1"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          Trust Score <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const score = row.original.trust_score;
        const display =
          typeof score === "string"
            ? score
            : `${(score * 100).toFixed(0)}%`;

        return (
          authStatus?.loggedIn ? (
            <div className="flex items-center justify-center gap-1">
              <span>{display}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button title="Trust Score Info">
                      <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-left space-y-2">
                    <p className="font-medium">
                      What this website stores on your device:
                    </p>

                    <ul className="list-disc pl-4 space-y-1">
                      <li>
                        <strong>Cookies:</strong> {row.original.cookie_count}
                      </li>
                      <li>
                        <strong>Saved site data:</strong>{" "}
                        {row.original.local_storage_count} local items
                        {row.original.indexeddb_count > 0 && (
                          <> and {row.original.indexeddb_count} database</>
                        )}
                      </li>
                      <li>
                        <strong>Cached files:</strong>{" "}
                        {row.original.cache_storage_count}
                      </li>
                      <li>
                        <strong>Background features:</strong>{" "}
                        {row.original.service_worker_count} active
                      </li>
                      <li>
                        <strong>Form data access:</strong>{" "}
                        {row.original.form_data_count}
                      </li>
                    </ul>

                    <p className="text-sm text-muted-foreground">
                      Fewer items usually means less tracking and less data kept after you leave.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ) : (
            <div className="flex justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Image
                    unoptimized
                    src="/padlock_icon.png"
                    alt="Create an account to see this data"
                    width={24}
                    height={24}
                  />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-left whitespace-pre-wrap">
                  <p>
                    {"Create a free account to view trust scores"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          )
        );
      },
    },

    {
      accessorKey: "created_at",
      meta: { label: "Last Seen" },
      header: ({ column }) => (
        <Button
          size="sm"
          variant="ghost"
          className="mx-auto flex items-center gap-1"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          Last Seen <ArrowUpDown className="h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const raw = row.original.created_at;
        return raw ? new Date(raw).toLocaleString() : "Unknown";
      },
    },

    {
      id: "actions",
      meta: { label: "Actions" },
      header: "Actions",
      cell: ({ row }) => {
        // ⭐ NEW: Disable delete actions when in excluded mode
        if (mode === "excluded") {
          const website = row.original.root_url;

          if (
            website === "https://locallens.local" ||
            website === "https://www.locallens.local"
          ) {
            return (
              <Button
                size="sm"
                disabled
                className="cursor-not-allowed opacity-50 bg-gray-400 text-white"
              >
                Protected
              </Button>
            );
          }

          const handleUnexclude = () => {
            window.postMessage(
              {
                source: "LocalLens Dev",
                type: "REMOVE_FROM_EXCEPTIONS",
                websites: [website],
              },
              "*"
            );

            toast.success(`Now tracking: ${website}`);
          };

          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    className="cursor-pointer bg-green-600 text-white hover:bg-green-700"
                    onClick={handleUnexclude}
                  ><RemoveRedEyeIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs whitespace-pre-wrap text-left">
                  Click to resume tracking for this website.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

          );
        }

        const handleRevoke = async () => {
          console.log("Revoke initiated for row:", row.original);
          const allowed = await canRevoke(1);
          if (!allowed) return;

          setLoadingRevokeId(row.original.id);

          if (excludedWebsites.includes(row.original.root_url)) {
            toast.warning("⛔ This site is excluded and cannot be deleted.");
            setLoadingRevokeId(null);
            return;
          }

          window.postMessage({
            source: "LocalLens Dev",
            type: "REVOKE_DOMAIN",
            origin: row.original.root_url,
            ids: row.original.ids,
          }, "*");

          const listener = async (event: MessageEvent) => {
            if (event.data?.source === "LocalLens Extension") {
              if (
                event.data?.type === "REVOKE_CONFIRM" &&
                event.data?.origin === row.original.root_url
              ) {
                window.removeEventListener("message", listener);

                toast.success(
                  `Successfully cleared ${row.original.root_url}`
                );

                setLoadingRevokeId(null);
                refreshData();
                await incrementRevokeCount();
              }
            }
          };

          window.addEventListener("message", listener);
        };

        const isLoading = loadingRevokeId !== null && loadingRevokeId === row.original.id;

        return (
          <div className="flex justify-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="destructive"
                    disabled={
                      isLoading ||
                      (row.original.root_url === "https://locallens.local")
                    }
                    onClick={() => {
                      if (
                        row.original.root_url ===
                        "https://locallens.local"
                      ) {
                        pendingRevokeRef.current = handleRevoke;
                        setDeleteDialogOpen(true);
                        return;
                      }

                      handleRevoke();
                    }}
                    className={
                      isLoading
                        ? "justify-center"
                        : "justify-center cursor-pointer hover:bg-red-700"
                    }
                  >
                    {isLoading ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      <DeleteIcon className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs whitespace-pre-wrap text-left">
                  Click to delete all stored data for this website.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                  onClick={() => {
                    requestDomainDetails(row.original);
                  }}
                >
                  <SettingsIcon className="h-4 w-4 text-neutral-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {authStatus?.isPremium
                    ? "View advanced analytics"
                    : "Premium is needed to view advanced analytics for this website"}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  // =============================================================
  // TABLE INITIALIZATION
  // =============================================================
  const table = useReactTable<TableRecord>({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // =============================================================
  // BULK REVOKE (unchanged)
  // =============================================================
  const handleBulkRevoke = async () => {
    if (!authStatus?.loggedIn || !userId) {
      toast.error("Please log in to revoke trackers.");
      return;
    }

    const selectedRows = table.getSelectedRowModel().rows;

    const includesLocalLens = selectedRows.some(
      (r) =>
        r.original.root_url ===
        "https://locallens.local"
    );

    const performBulk = async () => {
      const allowed = await canRevoke(selectedRows.length);
      if (!allowed) return;

      if (selectedRows.length === 0) {
        toast.error("No eligible domains selected to revoke.");
        return;
      }

      setBulkLoading(true);

      if (bulkRevokeTimeoutRef.current) {
        clearTimeout(bulkRevokeTimeoutRef.current);
      }
      bulkRevokeTimeoutRef.current = window.setTimeout(() => {
        setBulkLoading(false);
        bulkRevokeTimeoutRef.current = null;
        toast.error("Revoke timed out. Please try again.");
      }, 10000);


      const eligibleRows = selectedRows.filter(
        r => !excludedWebsites.includes(r.original.root_url)
      );

      if (eligibleRows.length === 0) {
        toast.error("Selected sites are excluded and cannot be deleted.");
        setBulkLoading(false);
        if (bulkRevokeTimeoutRef.current) {
          clearTimeout(bulkRevokeTimeoutRef.current);
          bulkRevokeTimeoutRef.current = null;
        }
        return;
      }


      const allIds = eligibleRows.flatMap(r => r.original.ids);
      const allOrigins = eligibleRows.map(r => r.original.root_url);

      const listener = async (event: MessageEvent) => {
        if (
          event.data?.source === "LocalLens Extension" &&
          event.data?.type === "REVOKE_BULK_CONFIRM"
        ) {
          window.removeEventListener("message", listener);
          toast.success(`Successfully cleared all selected domains`);

          setBulkLoading(false);
          if (bulkRevokeTimeoutRef.current) {
            clearTimeout(bulkRevokeTimeoutRef.current);
            bulkRevokeTimeoutRef.current = null;
          }

          incrementRevokeCount().catch((e) =>
            console.error("incrementRevokeCount failed:", e)
          );

          table.resetRowSelection();
          refreshData();
        }
      };

      window.addEventListener("message", listener);

      window.postMessage({
        source: "LocalLens Dev",
        type: "REVOKE_BULK",
        ids: allIds,
        origins: allOrigins,
      }, "*");
    };

    if (includesLocalLens) {
      pendingRevokeRef.current = performBulk;
      setDeleteDialogOpen(true);
      return;
    }

    await performBulk();
  };

  // =============================================================
  // RENDER
  // =============================================================

  return (
    <>
      {/* Delete Dialog — unchanged */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to continue?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deleting LocalLens’s own storage or cookies
              will sign you out of your account.
              You’ll need to refresh and log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="cursor-pointer"
              onClick={() => {
                setDeleteDialogOpen(false);
                pendingRevokeRef.current = null;
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              onClick={() => {
                if (pendingRevokeRef.current) {
                  pendingRevokeRef.current();
                  pendingRevokeRef.current = null;
                }
                setDeleteDialogOpen(false);
              }}
            >
              Delete Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Premium Analytics */}
      <Dialog
        open={analyticsOpen}
        onOpenChange={(open) => {
          setAnalyticsOpen(open);
          if (!open) {
            setDetails(null);
            setAnalyticsTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Advanced analytics</DialogTitle>
            <DialogDescription>
              Exact items found stored locally for{" "}
              <span className="font-medium">{details?.origin ?? analyticsTarget ?? ""}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="text-sm text-muted-foreground mb-2">
            <b>Severity scores are not perfect and only provide a general indication of how much data a site stores.</b>
          </div>

          <Separator className="" />

          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              Nothing here is uploaded — this view is generated locally from your device.
            </div>
            <Badge className="">Premium</Badge>
          </div>
          <ScrollArea className="max-h-[60vh] pr-4 w-full min-w-0">
            <Accordion type="multiple" className="w-full min-w-0">
              <AccordionItem value="cookies" className="w-full min-w-0">
                <AccordionTrigger className="">
                  <div className="flex w-full min-w-0 items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {(() => {
                        const n = details?.cookies?.length ?? 0;
                        const sev = severityFromCount("cookies", n);
                        return (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate">Cookies</span> {severityBadge(sev)}
                            {n > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyTableData("cookies");
                                      }}
                                      className="p-1 rounded hover:bg-muted cursor-pointer transition-colors inline-flex items-center"
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          e.stopPropagation();
                                          handleCopyTableData("cookies");
                                        }
                                      }}
                                      title="Copy all cookies"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Copy to clipboard</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="min-w-0">
                  {(details?.cookies?.length ?? 0) === 0 ? (
                    <div className="text-sm text-muted-foreground">No cookies found.</div>
                  ) : (
                    <div className="w-full overflow-x-auto rounded-md border">
                      <Table className="w-full">
                        <TableHeader className="">
                          <TableRow className="bg-muted">
                            <TableHead className="text-left">Item</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="">
                          {details!.cookies.map((c, i) => (
                            <TableRow className="" key={`${c.name}-${c.domain ?? ""}-${i}`}>
                              <TableCell className="font-medium whitespace-nowrap">
                                {c.name}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="localstorage" className="w-full min-w-0">
                <AccordionTrigger className="">
                  <div className="flex w-full min-w-0 items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {(() => {
                        const n = details?.localStorage ? Object.keys(details.localStorage).length : 0;
                        const sev = severityFromCount("localStorage", n);
                        return (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate">Local Storage</span> {severityBadge(sev)}
                            {n > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyTableData("localstorage");
                                      }}
                                      className="p-1 rounded hover:bg-muted cursor-pointer transition-colors inline-flex items-center"
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          e.stopPropagation();
                                          handleCopyTableData("localstorage");
                                        }
                                      }}
                                      title="Copy all local storage items"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Copy to clipboard</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="min-w-0">
                  {Object.keys(details?.localStorage ?? {}).length === 0 ? (
                    <div className="text-sm text-muted-foreground">No local storage items found.</div>
                  ) : (
                    <div className="w-full overflow-x-auto rounded-md border">
                      <Table className="w-full">
                        <TableHeader className="">
                          <TableRow className="bg-muted">
                            <TableHead className="text-left">Item</TableHead>
                            <TableHead className="text-left">Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="">
                          {Object.entries(details!.localStorage).map(([k, v]) => (
                            <TableRow className="" key={k}>
                              <TableCell className="font-medium whitespace-nowrap">
                                {k}
                              </TableCell>
                              <TableCell className="text-muted-foreground whitespace-nowrap">
                                {typeof v === "string" && v.length > 100 ? `${v.slice(0, 100)}…` : v}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="indexeddb" className="w-full min-w-0">
                <AccordionTrigger className="">
                  <div className="flex w-full min-w-0 items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {(() => {
                        const n = details?.indexedDb?.length ?? 0;
                        const sev = severityFromCount("indexedDb", n);
                        return (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate">IndexedDB</span> {severityBadge(sev)}
                            {n > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyTableData("indexeddb");
                                      }}
                                      className="p-1 rounded hover:bg-muted cursor-pointer transition-colors inline-flex items-center"
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          e.stopPropagation();
                                          handleCopyTableData("indexeddb");
                                        }
                                      }}
                                      title="Copy all IndexedDB databases"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Copy to clipboard</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="min-w-0 pt-2">
                  {/* If we have dumped details, render expandable DBs + stores */}
                  {(details?.indexedDbDetails?.length ?? 0) > 0 ? (
                    <Accordion type="multiple" className="w-full min-w-0 space-y-2">
                      {details!.indexedDbDetails.map((db) => {
                        const dbKey = `idb-db-${db.dbName}-${String(db.version ?? "")}`;

                        return (
                          <AccordionItem
                            key={dbKey}
                            value={dbKey}
                            className="w-full min-w-0 rounded-md border"
                          >
                            <AccordionTrigger className="px-3 py-2 hover:no-underline">
                              <div className="flex w-full min-w-0 items-center justify-between gap-2">
                                <div className="min-w-0 truncate font-medium">
                                  {db.dbName}
                                  {typeof db.version === "number" ? ` (v${db.version})` : ""}
                                </div>
                                <div className="text-xs text-muted-foreground whitespace-nowrap">
                                  {db.stores?.length ?? 0} store{(db.stores?.length ?? 0) === 1 ? "" : "s"}
                                </div>
                              </div>
                            </AccordionTrigger>

                            <AccordionContent className="min-w-0 px-3 pb-3 pt-2">
                              {(db.stores?.length ?? 0) === 0 ? (
                                <div className="text-sm text-muted-foreground">No object stores found.</div>
                              ) : (
                                <Accordion type="multiple" className="w-full min-w-0 space-y-2">
                                  {db.stores.map((store) => {
                                    const storeKey = `idb-store-${db.dbName}-${store.storeName}`;

                                    return (
                                      <AccordionItem
                                        key={storeKey}
                                        value={storeKey}
                                        className="w-full min-w-0 rounded-md border bg-muted/20"
                                      >
                                        <AccordionTrigger className="px-3 py-2 hover:no-underline">
                                          <div className="flex w-full min-w-0 items-center justify-between gap-2">
                                            <div className="min-w-0 truncate">
                                              {store.storeName}
                                            </div>
                                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                                              {store.rows?.length ?? 0} row{(store.rows?.length ?? 0) === 1 ? "" : "s"}
                                            </div>
                                          </div>
                                        </AccordionTrigger>

                                        <AccordionContent className="min-w-0 px-3 pb-3 pt-2">
                                          {(store.rows?.length ?? 0) === 0 ? (
                                            <div className="text-sm text-muted-foreground">No rows found.</div>
                                          ) : (
                                            <div className="w-full max-w-full overflow-x-auto rounded-md border bg-background">
                                              <Table className="w-full min-w-[700px]">
                                                <TableHeader className="">
                                                  <TableRow className="bg-muted">
                                                    <TableHead className="text-left">Key</TableHead>
                                                    <TableHead className="text-left">Value</TableHead>
                                                  </TableRow>
                                                </TableHeader>
                                                <TableBody className="">
                                                  {store.rows.map((r, i) => (
                                                    <TableRow className="" key={`${storeKey}-${i}`}>
                                                      <TableCell className="font-medium whitespace-nowrap">
                                                        {r.key}
                                                      </TableCell>
                                                      <TableCell className="text-muted-foreground whitespace-nowrap">
                                                        {typeof r.value === "string" && r.value.length > 120
                                                          ? `${r.value.slice(0, 120)}…`
                                                          : r.value}
                                                      </TableCell>
                                                    </TableRow>
                                                  ))}
                                                </TableBody>
                                              </Table>
                                            </div>
                                          )}
                                        </AccordionContent>
                                      </AccordionItem>
                                    );
                                  })}
                                </Accordion>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  ) : (
                    /* Fallback: no details yet, show just DB names as a clean list (NOT a table) */
                    (details?.indexedDb?.length ?? 0) === 0 ? (
                      <div className="text-sm text-muted-foreground">No IndexedDB databases found.</div>
                    ) : (
                      <div className="space-y-2">
                        {details!.indexedDb.map((db, i) => (
                          <div
                            key={`${db.name}-${db.version ?? ""}-${i}`}
                            className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                          >
                            <div className="min-w-0 truncate font-medium">
                              {db.name}{db.version ? ` (v${db.version})` : ""}
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              (No store details)
                            </div>
                          </div>
                        ))}
                        <div className="text-xs text-muted-foreground">
                          If you’re seeing this, the page likely blocked IndexedDB enumeration or the dump request didn’t return.
                        </div>
                      </div>
                    )
                  )}
                </AccordionContent>


              </AccordionItem>

              <AccordionItem value="cache" className="w-full min-w-0">
                <AccordionTrigger className="">
                  <div className="flex w-full min-w-0 items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {(() => {
                        const n = details?.cacheStorage?.length ?? 0;
                        const sev = severityFromCount("cache", n);
                        return (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate">Cache Storage</span> {severityBadge(sev)}
                            {n > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyTableData("cache");
                                      }}
                                      className="p-1 rounded hover:bg-muted cursor-pointer transition-colors inline-flex items-center"
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          e.stopPropagation();
                                          handleCopyTableData("cache");
                                        }
                                      }}
                                      title="Copy all cache storage items"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Copy to clipboard</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="min-w-0">
                  {(details?.cacheStorage?.length ?? 0) === 0 ? (
                    <div className="text-sm text-muted-foreground">No cache items found.</div>
                  ) : (
                    <div className="w-full overflow-x-auto rounded-md border">
                      <Table className="w-full">
                        <TableHeader className="">
                          <TableRow className="bg-muted">
                            <TableHead className="text-left">Item</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="">
                          {details!.cacheStorage.map((x, i) => (
                            <TableRow className="" key={`${x}-${i}`}>
                              <TableCell className="font-medium whitespace-nowrap">
                                {x}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="workers" className="w-full min-w-0">
                <AccordionTrigger className="">
                  <div className="flex w-full min-w-0 items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {(() => {
                        const n = details?.serviceWorkers?.length ?? 0;
                        const sev = severityFromCount("serviceWorkers", n);
                        return (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate">Service Workers</span> {severityBadge(sev)}
                            {n > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyTableData("workers");
                                      }}
                                      className="p-1 rounded hover:bg-muted cursor-pointer transition-colors inline-flex items-center"
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          e.stopPropagation();
                                          handleCopyTableData("workers");
                                        }
                                      }}
                                      title="Copy all service workers"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Copy to clipboard</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="min-w-0">
                  {(details?.serviceWorkers?.length ?? 0) === 0 ? (
                    <div className="text-sm text-muted-foreground">No service workers found.</div>
                  ) : (
                    <div className="w-full overflow-x-auto rounded-md border">
                      <Table className="w-full">
                        <TableHeader className="">
                          <TableRow className="bg-muted">
                            <TableHead className="text-left">Item</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="">
                          {details!.serviceWorkers.map((x, i) => (
                            <TableRow className="" key={`${x}-${i}`}>
                              <TableCell className="font-medium whitespace-nowrap">
                                {x}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="forms" className="w-full min-w-0">
                <AccordionTrigger className="">
                  <div className="flex w-full min-w-0 items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {(() => {
                        const n = details?.formData?.length ?? 0;
                        const sev = severityFromCount("formData", n);
                        return (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate">Form Data</span> {severityBadge(sev)}
                            {n > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyTableData("forms");
                                      }}
                                      className="p-1 rounded hover:bg-muted cursor-pointer transition-colors inline-flex items-center"
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          e.stopPropagation();
                                          handleCopyTableData("forms");
                                        }
                                      }}
                                      title="Copy all form data"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Copy to clipboard</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="min-w-0">
                  {(details?.formData?.length ?? 0) === 0 ? (
                    <div className="text-sm text-muted-foreground">No form data found.</div>
                  ) : (
                    <div className="w-full overflow-x-auto rounded-md border">
                      <Table className="w-full">
                        <TableHeader className="">
                          <TableRow className="bg-muted">
                            <TableHead className="text-left">Item</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="">
                          {details!.formData.map((x, i) => (
                            <TableRow className="" key={`${x}-${i}`}>
                              <TableCell className="font-medium whitespace-nowrap">
                                {x}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <div className="w-full">
        {/* Filter + Actions */}
        <div className="flex items-center py-4 gap-4">
          <Input
            type="text"
            placeholder="Filter websites..."
            value={
              (table.getColumn("root_url")?.getFilterValue() as string) ??
              ""
            }
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              table.getColumn("root_url")?.setFilterValue(e.target.value)
            }
            className="max-w-sm"
          />

          {/* ⭐ Responsive Actions (horizontal on desktop, stacked on mobile) */}
          <div
            className="
    ml-auto 
    flex flex-row flex-wrap gap-2 
    sm:flex-row 
    max-sm:flex-col max-sm:w-full
  "
          >
            {/* Add to Exceptions */}
            {mode === "tracked" &&
              table.getSelectedRowModel().rows.length > 0 && (
                <Button
                  size="sm"
                  className="cursor-pointer bg-blue-600 text-white hover:bg-blue-700 max-sm:w-full"
                  onClick={handleAddToExceptions}
                >
                  Add to Exclusions
                </Button>
              )}

            {/* Track Selected */}
            {mode === "excluded" &&
              table.getSelectedRowModel().rows.length > 0 && (
                <Button
                  size="sm"
                  className="cursor-pointer bg-green-600 text-white hover:bg-green-700 max-sm:w-full"
                  onClick={() => handleRemoveFromExceptions()}
                >
                  Track Selected
                </Button>
              )}

            {/* Delete Selected */}
            {mode === "tracked" &&
              table.getSelectedRowModel().rows.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={
                    handleBulkRevoke as React.MouseEventHandler<HTMLButtonElement>
                  }
                  disabled={bulkLoading}
                  className="cursor-pointer max-sm:w-full"
                >
                  {bulkLoading ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Revoking Selected...
                    </>
                  ) : (
                    "Delete Selected"
                  )}
                </Button>
              )}

            {/* Columns dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="max-sm:w-full">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="" align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      className=""
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value: boolean) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.columnDef.meta?.label ?? column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* TABLE */}
        <div className="rounded-md border">
          <Table className="">
            <TableHeader className="">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-center">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody className="">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    className=""
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="text-center">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="">
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>

          <span className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>

      </div>
    </>
  );
}
