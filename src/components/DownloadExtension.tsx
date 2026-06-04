"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Eye, Shield, Trash2 } from "lucide-react";
import Footer from "@/components/Footer";
import { Separator } from "@/components/ui/separator";

type FootstepInstance = {
  id: number;
  x: number;
  y: number;
  rotation: number;
  isLeft: boolean;
};

const FootprintIcon = ({ isLeft }: { isLeft: boolean }) => (
  <svg
    width="13"
    height="19"
    viewBox="0 0 13 19"
    fill="currentColor"
    className={isLeft ? "-scale-x-100" : ""}
  >
    <ellipse cx="6.5" cy="13.5" rx="4.5" ry="5" />
    <circle cx="2"    cy="7"   r="1.6" />
    <circle cx="5"    cy="4.5" r="1.6" />
    <circle cx="8.2"  cy="3.8" r="1.5" />
    <circle cx="11"   cy="5.2" r="1.3" />
    <circle cx="12.5" cy="7.8" r="1.1" />
  </svg>
);

// Sets CSS custom properties via DOM ref so no JSX style attribute is needed
const FootstepEl = ({ step }: { step: FootstepInstance }) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    outerRef.current?.style.setProperty("--step-x", `${step.x}%`);
    outerRef.current?.style.setProperty("--step-y", `${step.y}%`);
    innerRef.current?.style.setProperty("--step-rotation", `${step.rotation}deg`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={outerRef} className="absolute animate-footstep footstep-step text-blue-400/30">
      <div ref={innerRef} className="footstep-inner">
        <FootprintIcon isLeft={step.isLeft} />
      </div>
    </div>
  );
};

const DownloadExtension = () => {
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [screenTallEnough, setScreenTallEnough] = useState(true);
  const [browser, setBrowser] = useState<"chrome" | "edge" | "unsupported">("unsupported");
  const [visibleSteps, setVisibleSteps] = useState<FootstepInstance[]>([]);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("edg")) setBrowser("edge");
    else if (ua.includes("chrome")) setBrowser("chrome");
    else setBrowser("unsupported");
  }, []);

  const scrollToInfo = () => {
    const nextSection = document.getElementById("features-section");
    if (nextSection) {
      window.scrollTo({ top: nextSection.offsetTop - 40, behavior: "smooth" });
    }
  };

  // Spawns footstep trails along the left/right edges of the hero
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    function spawnTrail() {
      const isLeftSide = Math.random() < 0.5;
      const startX = isLeftSide ? 2 + Math.random() * 12 : 84 + Math.random() * 12;
      const startY = 10 + Math.random() * 55;
      const dirDeg = (Math.random() < 0.5 ? 90 : -90) + (Math.random() * 50 - 25);
      const numSteps = 5 + Math.floor(Math.random() * 4);
      const angleRad = (dirDeg * Math.PI) / 180;
      const stepForward = 3.2;
      const stepSide = 0.9;
      const trailBase = Date.now();

      for (let i = 0; i < numSteps; i++) {
        const isLeft = i % 2 === 0;
        const side = isLeft ? -1 : 1;
        const step: FootstepInstance = {
          id: trailBase * 100 + i,
          x: startX + i * stepForward * Math.cos(angleRad) + side * stepSide * Math.sin(angleRad),
          y: startY + i * stepForward * Math.sin(angleRad) - side * stepSide * Math.cos(angleRad),
          rotation: dirDeg + 90,
          isLeft,
        };

        const addTimer = setTimeout(() => {
          setVisibleSteps((prev) => [...prev, step]);
          const removeTimer = setTimeout(() => {
            setVisibleSteps((prev) => prev.filter((s) => s.id !== step.id));
          }, 2600);
          timers.push(removeTimer);
        }, i * 500);

        timers.push(addTimer);
      }
    }

    const initial = setTimeout(spawnTrail, 1800);
    const interval = setInterval(spawnTrail, 7000);
    timers.push(initial);

    return () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowScrollIndicator(window.scrollY < 100);
    const handleResize = () => {
      setScreenTallEnough(window.innerHeight >= window.screen.height * 0.9);
    };
    handleResize();
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const chromeWebstoreUrl =
    "https://chromewebstore.google.com/detail/fbhnodhfmjidmjcoknffohdbbajcfeii?utm_source=item-share-cb";

  const renderDownloadButton = (variant: "primary" | "secondary" = "primary") => {
    const label =
      browser === "edge"
        ? "Add to Edge - It's Free"
        : browser === "chrome"
        ? "Add to Chrome - It's Free"
        : "Browser Not Supported";

    const iconSrc =
      browser === "edge"
        ? "/edge-icon.png"
        : browser === "chrome"
        ? "/chrome-icon.png"
        : null;

    const disabled = browser === "unsupported";

    const primaryClass = `cursor-pointer h-13 px-7 text-base font-semibold flex items-center gap-2.5 rounded-full shadow-lg shadow-blue-300/40 transition-all duration-200
      ${disabled ? "bg-gray-300 cursor-not-allowed text-gray-500" : "bg-blue-500 hover:bg-blue-600 text-white animate-shake-button"}`;

    const secondaryClass = `cursor-pointer h-13 px-7 text-base font-semibold flex items-center gap-2.5 rounded-full shadow-lg shadow-sky-100 transition-all duration-200
      ${disabled ? "bg-gray-300 cursor-not-allowed text-gray-500" : "bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-muted text-slate-800 dark:text-foreground border border-gray-200 dark:border-border"}`;

    return (
      <Button
        disabled={disabled}
        className={variant === "primary" ? primaryClass : secondaryClass}
        asChild={!disabled}
      >
        <a href={disabled ? undefined : chromeWebstoreUrl} target="_blank">
          {iconSrc && (
            <Image unoptimized src={iconSrc} alt="Browser icon" width={20} height={20} />
          )}
          {label}
        </a>
      </Button>
    );
  };

  const videoObjectJsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: "LocalLens Demo \u2014 See & Delete Hidden Browser Data",
    description:
      "See how LocalLens reveals every cookie, IndexedDB entry, service worker, cache file and local storage item that websites store in your browser \u2014 and how to delete it all in one click.",
    thumbnailUrl: "https://img.youtube.com/vi/8SEQfLd6n_Y/maxresdefault.jpg",
    uploadDate: "2026-02-13",
    duration: "PT0M55S",
    contentUrl: "https://www.youtube.com/watch?v=8SEQfLd6n_Y",
    embedUrl: "https://www.youtube-nocookie.com/embed/8SEQfLd6n_Y",
    publisher: {
      "@type": "Organization",
      name: "LocalLens",
      logo: {
        "@type": "ImageObject",
        url: "https://www.locallens.local/icon-512.png",
      },
    },
  };

  const homepageFaqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What data can websites store on my device?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Websites can store cookies, local storage, session storage, IndexedDB databases, cache storage, service workers and form data directly in your browser without you knowing.",
        },
      },
      {
        "@type": "Question",
        name: "Is LocalLens free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. The extension is free to download. A free account unlocks the dashboard and lets you delete data from up to 5 websites. Premium unlocks full analytics, drill-down, and notification-based deletion.",
        },
      },
      {
        "@type": "Question",
        name: "Does LocalLens work on Chrome and Edge?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, LocalLens is available as an extension for both Google Chrome and Microsoft Edge.",
        },
      },
      {
        "@type": "Question",
        name: "How do I delete all website data from my browser?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Install LocalLens, open your dashboard, and click 'Delete All'. You can add trusted websites to an exclusions list so their data is never removed.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageFaqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoObjectJsonLd) }}
      />
      {/* HERO */}
      <section className="relative w-full overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_#e0f2fe_0%,_#f0f9ff_35%,_#f8fafc_65%,_#f0fdf4_100%)] dark:bg-none dark:bg-background">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-60px] left-[-80px] w-[480px] h-[480px] bg-blue-200/40 rounded-full blur-3xl animate-bubble-drift-slow" />
          <div className="absolute top-[40px] right-[-100px] w-[420px] h-[420px] bg-indigo-200/30 rounded-full blur-3xl animate-bubble-drift-medium" />
          <div className="absolute top-[350px] left-1/2 -translate-x-1/2 w-[640px] h-[280px] bg-emerald-100/50 rounded-full blur-3xl animate-bubble-drift-fast" />
        </div>

        <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
          {visibleSteps.map((step) => (
            <FootstepEl key={step.id} step={step} />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-28 pb-0">
          <div className="flex flex-col items-center gap-4 mb-5">
            <Image
              unoptimized
              priority
              src="/logo-icon.png"
              alt="LocalLens logo"
              width={72}
              height={72}
              className="rounded-2xl"
            />
            <p className="text-5xl sm:text-6xl md:text-7xl font-bold text-slate-900 dark:text-foreground tracking-tight leading-none">
              LocalLens
            </p>
          </div>

          <h1 className="text-lg sm:text-xl text-slate-500 dark:text-muted-foreground max-w-xl leading-relaxed mb-7">
            See & delete all hidden data websites store in your browser, and
            manage it instantly.
          </h1>

          <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
            {renderDownloadButton("primary")}
            <button
              type="button"
              onClick={scrollToInfo}
              className="text-slate-500 hover:text-slate-700 dark:text-muted-foreground dark:hover:text-foreground text-sm font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              See how it works
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {["Expose Hidden Data", "Revoke Unwanted Access", "Private Dashboard"].map((f) => (
              <span
                key={f}
                className="text-xs font-medium text-slate-500 dark:text-muted-foreground border border-slate-200 dark:border-border bg-white dark:bg-muted px-3 py-1.5 rounded-full"
              >
                {f}
              </span>
            ))}
          </div>

          {/* Dashboard SVG - section is intentionally taller than viewport so the SVG peeks above the fold */}
          <div className="relative w-full max-w-5xl mx-auto">
            <div className="rounded-t-2xl overflow-hidden shadow-[0_8px_60px_-8px_rgba(0,0,0,0.18)] border border-b-0 border-gray-200 dark:border-zinc-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mounted && theme === "dark" ? "/locallens dashboard dark mode.svg" : "/locallens dashboard.svg"}
                alt="LocalLens dashboard showing cookies, local storage, IndexedDB, and service workers stored by websites in your browser"
                fetchPriority="high"
                className="w-full h-auto block"
              />
            </div>
            <div className="absolute bottom-0 inset-x-0 h-56 bg-gradient-to-t from-white dark:from-background via-white/70 dark:via-background/70 to-transparent pointer-events-none" />
          </div>
        </div>

        {showScrollIndicator && screenTallEnough && (
          <button
            type="button"
            onClick={scrollToInfo}
            title="Scroll to more information"
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 text-sky-500 hover:text-sky-600 animate-bounce transition-colors cursor-pointer"
          >
            <ChevronDown size={36} strokeWidth={2} />
          </button>
        )}
      </section>

      {/* FEATURES */}
      <section id="features-section" className="section-dot-grid relative bg-white dark:bg-background border-t border-gray-100 dark:border-border">
        <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-white dark:from-background to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-white dark:from-background to-transparent pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-sky-500 uppercase tracking-widest mb-3">
              Why it matters
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-foreground mb-4">
              Take Back Control of Your Online Privacy
            </h2>
            <p className="text-slate-500 dark:text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
              Every time you click &ldquo;Allow&rdquo; or &ldquo;Accept,&rdquo;
              websites quietly store your data. LocalLens reveals
              what&apos;s been saved - and lets you erase it.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border p-8 shadow-sm hover:shadow-md hover:border-sky-200 dark:hover:border-sky-700 transition-all duration-300">
              <div className="inline-flex w-11 h-11 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950 border border-sky-100 dark:border-sky-800 mb-5">
                <Eye size={20} className="text-sky-600 dark:text-sky-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-foreground mb-2">Uncover Hidden Permissions</h3>
              <p className="text-slate-500 dark:text-muted-foreground leading-relaxed text-sm">
                Most websites store more than you realise - trackers,
                identifiers, and tokens. See everything, then decide what stays.
              </p>
            </div>

            <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border p-8 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all duration-300">
              <div className="inline-flex w-11 h-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-800 mb-5">
                <Shield size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-foreground mb-2">Stop Silent Tracking</h3>
              <p className="text-slate-500 dark:text-muted-foreground leading-relaxed text-sm">
                Cookies alone don&apos;t stop scripts from tracking behaviour.
                LocalLens reveals hidden tracking in real time.
              </p>
            </div>

            <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border p-8 shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 transition-all duration-300 sm:col-span-2 lg:col-span-1">
              <div className="inline-flex w-11 h-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-800 mb-5">
                <Trash2 size={20} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-foreground mb-2">Own Your Digital Footprint</h3>
              <p className="text-slate-500 dark:text-muted-foreground leading-relaxed text-sm">
                See exactly what&apos;s stored about you and clean it up
                instantly - all in one beautiful dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white dark:bg-background border-t border-gray-100 dark:border-border">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-sky-500 uppercase tracking-widest mb-3">
              Simple setup
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-foreground mb-4">
              How LocalLens works
            </h2>
            <p className="text-slate-500 dark:text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
              Three steps to full visibility over what websites store in your browser.
            </p>
          </div>
          <ol className="grid gap-8 md:grid-cols-3">
            <li className="flex flex-col gap-4">
              <div className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-sky-500 text-white font-bold text-lg shrink-0">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-foreground mb-2">
                  Install the free Chrome or Edge extension
                </h3>
                <p className="text-slate-500 dark:text-muted-foreground text-sm leading-relaxed">
                  Add LocalLens from the Chrome Web Store in seconds. It works on both Google Chrome and Microsoft Edge at no cost.
                </p>
              </div>
            </li>
            <li className="flex flex-col gap-4">
              <div className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-sky-500 text-white font-bold text-lg shrink-0">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-foreground mb-2">
                  Browse normally — it runs silently in the background
                </h3>
                <p className="text-slate-500 dark:text-muted-foreground text-sm leading-relaxed">
                  LocalLens monitors what websites store as you browse. No configuration needed — it works automatically from the moment it&apos;s installed.
                </p>
              </div>
            </li>
            <li className="flex flex-col gap-4">
              <div className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-sky-500 text-white font-bold text-lg shrink-0">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-foreground mb-2">
                  Open your dashboard to see and delete everything
                </h3>
                <p className="text-slate-500 dark:text-muted-foreground text-sm leading-relaxed">
                  See every cookie, IndexedDB entry, service worker, and cached file websites have stored on your device — then delete it all in one click.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* WHAT WE REVEAL */}
      <section className="section-dot-grid relative bg-slate-50 dark:bg-muted/30 border-t border-gray-100 dark:border-border">
        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-sky-500 uppercase tracking-widest mb-3">
              Full transparency
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-foreground mb-4">
              Every type of browser data websites store on your device
            </h2>
            <p className="text-slate-500 dark:text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
              LocalLens reveals all seven storage types — not just cookies.
            </p>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[
              {
                name: "Cookies",
                desc: "Small text files websites store to remember who you are, keep you logged in, and track your activity across sessions.",
              },
              {
                name: "Local Storage",
                desc: "Larger key-value data that persists after the browser closes — often used for preferences, tokens, or tracking identifiers.",
              },
              {
                name: "Session Storage",
                desc: "Temporary data stored only for the current browser tab or session, cleared when the tab is closed.",
              },
              {
                name: "IndexedDB",
                desc: "A full database built into your browser that websites use to store large amounts of structured data — often invisible to users.",
              },
              {
                name: "Cache Storage",
                desc: "Files such as images, scripts, and pages that websites save for offline use and faster loading — they can hold tracking assets too.",
              },
              {
                name: "Service Workers",
                desc: "Background scripts installed by websites that continue running even after you close the tab, enabling push notifications and offline access.",
              },
              {
                name: "Form Data",
                desc: "Data you have typed into forms that your browser has saved automatically — names, addresses, search queries, and more.",
              },
            ].map(({ name, desc }) => (
              <li
                key={name}
                className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border p-6 shadow-sm"
              >
                <h3 className="text-base font-semibold text-slate-900 dark:text-foreground mb-2">
                  {name}
                </h3>
                <p className="text-slate-500 dark:text-muted-foreground text-sm leading-relaxed">
                  {desc}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* VIDEO */}
      {/* CTA */}
      <section className="bg-gradient-to-b from-sky-50 to-white dark:from-muted/30 dark:to-background border-t border-sky-100/60 dark:border-border">
        <div className="max-w-3xl mx-auto px-6 py-28 text-center">
          <div className="flex justify-center mb-6">
            <Image
              unoptimized
              src="/logo-icon.png"
              alt="LocalLens"
              width={52}
              height={52}
              className="rounded-xl"
            />
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-foreground mb-4 tracking-tight">
            Start cleaning up - it&apos;s free
          </h2>
          <p className="text-slate-500 dark:text-muted-foreground mb-10 text-lg max-w-xl mx-auto">
            Install the extension in seconds and see what websites know about you right now.
          </p>
          {renderDownloadButton("primary")}
          <p className="mt-5 text-xs text-slate-400 dark:text-muted-foreground">
            After installing, return to this page to start managing your data.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-background border-t border-gray-100 dark:border-border py-12">
        <div className="w-full max-w-6xl mx-auto px-6">
          <Separator className="mb-8" />
          <Footer />
        </div>
      </footer>
    </>
  );
};

export default DownloadExtension;
