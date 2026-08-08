import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import { AuthGate } from "@/components/AuthGate";
import { AppShell } from "@/components/AppShell";
import { ServiceWorker } from "@/components/ServiceWorker";
import { TourProvider } from "@/components/tour/TourProvider";

export const metadata: Metadata = {
  applicationName: "Cris Budget OS",
  title: "Cris Budget OS — Family Money Dashboard",
  description:
    "Manage income, expenses, debts, savings goals and travel funds for a Filipino household, with AI-powered insights.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Budget OS",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f8f8f7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <StoreProvider>
            <AuthGate>
              <TourProvider>
                <AppShell>{children}</AppShell>
              </TourProvider>
            </AuthGate>
          </StoreProvider>
        </AuthProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
