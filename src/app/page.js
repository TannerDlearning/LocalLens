import HomeClient from "@/components/HomeClient";

export const metadata = {
  title: "LocalLens \u2014 See & Delete Hidden Browser Trackers Free",
  description:
    "Websites secretly store cookies, IndexedDB, cache, service workers & more in your browser. See every hidden tracker and delete them all in one click. Free.",
  alternates: {
    canonical: "https://www.locallens.local/",
  },
  openGraph: {
    type: "website",
    url: "https://www.locallens.local/",
    title: "LocalLens \u2014 See & Delete Hidden Browser Trackers Free",
    description:
      "Websites secretly store cookies, IndexedDB, cache, service workers & more in your browser. See every hidden tracker and delete them all in one click. Free.",
    images: [
      {
        url: "https://www.locallens.local/og-image.png",
        width: 1200,
        height: 630,
        alt: "LocalLens browser privacy extension \u2014 see and delete all hidden data websites store on your device",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LocalLens \u2014 See & Delete Hidden Browser Trackers Free",
    description:
      "Websites secretly store cookies, IndexedDB, cache, service workers & more in your browser. See every hidden tracker and delete them all in one click. Free.",
    images: ["https://www.locallens.local/og-image.png"],
  },
};

export default function HomePage() {
  return <HomeClient />;
}
