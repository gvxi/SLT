import type { Metadata } from "next";
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
