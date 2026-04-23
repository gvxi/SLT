import type { Metadata, Viewport } from "next";
import { Inter, Cairo } from "next/font/google";
import AppProviders from "@/components/providers/AppProviders";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SLT - Business Management",
  description: "Task, product, invoice & quotation management",
  applicationName: "SLT",
  manifest: "/site.webmanifest?v=20260423",
  icons: {
    icon: [
      { url: "/favicon-96x96.png?v=20260423", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg?v=20260423", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico?v=20260423",
    apple: [{ url: "/apple-touch-icon.png?v=20260423", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "SLT",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={`${inter.variable} ${cairo.variable}`} style={{ margin: 0 }}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
