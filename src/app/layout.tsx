import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";
// Registers the host → business resolver used by tenant-scoped models in Server Components.
import "@/lib/tenant";

// Fonts are self-hosted (latin subset from Google Fonts) so builds don't depend on fetching from Google.
const cormorant = localFont({
  src: [
    { path: "./fonts/CormorantGaramond-Variable.woff2", weight: "400 600", style: "normal" },
    { path: "./fonts/CormorantGaramond-Italic-Variable.woff2", weight: "400 600", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
});
const jost = localFont({
  src: "./fonts/Jost-Variable.woff2",
  weight: "300 600",
  variable: "--font-jost",
  display: "swap",
});
const script = localFont({
  src: "./fonts/GreatVibes-Regular.woff2",
  weight: "400",
  variable: "--font-script",
  display: "swap",
});

// Titles, descriptions and icons come from each business (store layout) or the platform (hub layout).
export const metadata: Metadata = {};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable} ${script.variable}`}>
      <body className="min-h-screen">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: "var(--color-ivory)", color: "var(--color-cocoa)", border: "1px solid var(--color-line)", fontFamily: "var(--font-jost)" },
          }}
        />
      </body>
    </html>
  );
}
