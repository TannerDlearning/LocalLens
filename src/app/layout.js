import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/components/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  metadataBase: new URL("https://www.locallens.local"),
  title: "LocalLens \u2014 Browser Privacy Extension",
  description:
    "LocalLens is a free Chrome and Edge browser extension that reveals and deletes all hidden data websites store in your browser.",
  openGraph: {
    type: "website",
    siteName: "LocalLens",
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
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
};

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LocalLens",
  applicationCategory: "BrowserApplication",
  operatingSystem: "Chrome, Edge",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "GBP",
  },
  description:
    "A browser extension that reveals and deletes all hidden data websites store locally on your device.",
  url: "https://www.locallens.local",
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "LocalLens",
  url: "https://www.locallens.local",
  logo: {
    "@type": "ImageObject",
    url: "https://www.locallens.local/icon-512.png",
    width: 512,
    height: 512,
  },
  description:
    "LocalLens is a free Chrome and Edge browser extension that reveals and deletes all hidden data websites store on your device, including cookies, IndexedDB, cache, local storage, service workers and form data.",
  sameAs: [
    "https://chromewebstore.google.com/detail/fbhnodhfmjidmjcoknffohdbbajcfeii",
  ],
};

const imageObjectSchema = {
  "@context": "https://schema.org",
  "@type": "ImageObject",
  url: "https://www.locallens.local/og-image.png",
  width: 1200,
  height: 630,
  caption:
    "LocalLens browser privacy extension \u2014 see and delete all hidden data websites store on your device",
};

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "LocalLens",
  description:
    "A free browser extension for Chrome and Edge that reveals and deletes all hidden data websites store in your browser, including cookies, IndexedDB, cache, service workers, local storage, and form data.",
  brand: { "@type": "Brand", name: "LocalLens" },
  url: "https://www.locallens.local",
  image: "https://www.locallens.local/icon-512.png",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "GBP",
    availability: "https://schema.org/InStock",
    url: "https://chromewebstore.google.com/detail/fbhnodhfmjidmjcoknffohdbbajcfeii",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(imageObjectSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
        <meta name="msapplication-TileImage" content="/favicon-144x144.png" />
        <meta name="msapplication-TileColor" content="#1a56db" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Analytics />
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
