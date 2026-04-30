import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/auth";
import { Providers } from "@/components/providers";
import { RouteHeaderVisibility } from "@/components/route-header-visibility";
import { ShopHeader } from "@/components/shop-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cleverlocale — Marketplace (INR)",
  description: "Multi-vendor ecommerce — catalog, cart, and dummy checkout.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="flex min-h-full flex-col bg-white text-zinc-900">
        <Providers session={session}>
          <RouteHeaderVisibility>
            <ShopHeader session={session} />
          </RouteHeaderVisibility>
          <div className="flex-1">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
