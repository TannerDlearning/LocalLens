"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import DownloadExtension from "@/components/DownloadExtension";
import Dashboard from "@/components/Dashboard";
import { Suspense } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function HomeClient() {
  const [extensionDetected, setExtensionDetected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOutdatedVersion, setIsOutdatedVersion] = useState(false);
  const toastIdRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      toastIdRef.current = toast.loading("Searching for extension…");
    }, 50);
    return () => {
      clearTimeout(timer);
      toast.dismiss(toastIdRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isLoading) toast.dismiss(toastIdRef.current);
  }, [isLoading]);

  useEffect(() => {
    const REQUIRED_VERSION = "1.5"; // Update this on new extension release
    let retries = 0;
    const MAX_RETRIES = 5;

    function handleMessage(event) {
      const {source, type, version} = event.data || {};

      if (source !== "LocalLens Extension") return;

      //Extension responded but version is wrong
      if (type === "EXTENSION_PRESENT") {
        setExtensionDetected(true);
        if (version !== REQUIRED_VERSION) {
          setIsOutdatedVersion(true);
        } else {
          setIsOutdatedVersion(false);
        }

        clearInterval(pingInterval);
        setTimeout(() => setIsLoading(false), 300);
      }
    }

    // Register the listener ONCE
    window.addEventListener("message", handleMessage);

    // Ping extension repeatedly until detected
    const pingInterval = setInterval(() => {
      if (retries >= MAX_RETRIES) {
        clearInterval(pingInterval);
        setIsLoading(false);
        return;
      }

      window.postMessage(
        { source: "LocalLens Dev", type: "PING_EXTENSION" },
        "*"
      );

      retries++;
    }, 1000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(pingInterval);
    };
  }, []);




  function ForcedUpdateModal({ open }) {
    return (
      <AlertDialog open={open}>
        <AlertDialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="max-w-md pointer-events-auto"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold">
              Extension Update Required
            </AlertDialogTitle>

            <AlertDialogDescription className="text-base leading-relaxed">
              Your LocalLens browser extension is out of date.
              You must update it before continuing.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-6 flex flex-col items-center gap-4">
            <a
              href="https://chromewebstore.google.com/detail/fbhnodhfmjidmjcoknffohdbbajcfeii"
              target="_blank"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg font-semibold cursor-pointer"
            >
              Update Extension
            </a>

            <p className="text-xs text-gray-500 text-center">
              Refresh the page after updating.
            </p>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <>
      <Suspense fallback={null}>
      </Suspense>
      <Navbar extensionDetected={extensionDetected} />
      <ForcedUpdateModal open={isOutdatedVersion} />
      <div className="w-full overflow-x-hidden">
        {extensionDetected ? <Dashboard isLoading={isLoading} /> : <DownloadExtension />}
      </div>
    </>
  );
}
