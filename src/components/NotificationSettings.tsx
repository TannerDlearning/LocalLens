"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";

type NotificationPrefs = {
  enabled: boolean;
  threshold: number;
};

export default function NotificationSettings({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const [enabled, setEnabled] = useState(true);
  const [threshold, setThreshold] = useState(20);
  const [loading, setLoading] = useState(false);

  const prefs: NotificationPrefs = useMemo(
    () => ({ enabled, threshold }),
    [enabled, threshold]
  );

  useEffect(() => {
    if (!open) return;

    setLoading(true);

    const handler = (event: MessageEvent) => {
      if (event.data?.source !== "LocalLens Extension") return;
      if (event.data?.type !== "NOTIFICATION_PREFS_RESPONSE") return;

      const p = event.data?.prefs;
      if (typeof p?.enabled === "boolean") setEnabled(p.enabled);
      if (typeof p?.threshold === "number") setThreshold(p.threshold);

      setLoading(false);
      window.removeEventListener("message", handler);
    };

    window.addEventListener("message", handler);

    window.postMessage(
      { source: "LocalLens Dev", type: "REQUEST_NOTIFICATION_PREFS" },
      "*"
    );

    return () => window.removeEventListener("message", handler);
  }, [open]);

  const save = () => {
    window.postMessage(
      { source: "LocalLens Dev", type: "SET_NOTIFICATION_PREFS", prefs },
      "*"
    );
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Notification settings</AlertDialogTitle>
          <AlertDialogDescription>
            Control when LocalLens shows tracker alerts.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="font-medium">Notifications</span>
              <span className="text-sm text-muted-foreground">
                Turn tracker alerts on or off.
              </span>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} disabled={loading} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="font-medium">Minimum trackers</span>
                <span className="text-sm text-muted-foreground">
                  Only alert when a site hits this count.
                </span>
              </div>
              <span className="text-sm font-medium tabular-nums">{threshold}</span>
            </div>

            <Slider
              value={[threshold]}
              min={10}
              max={150}
              step={1}
              onValueChange={(v) => setThreshold(v[0] ?? 20)}
              disabled={loading || !enabled}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer" onClick={() => setOpen(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction className="cursor-pointer" onClick={save}>
            Save
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
