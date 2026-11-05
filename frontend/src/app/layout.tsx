import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "CampusDeals | E-commerce & Auctions",
  description: "Your one-stop campus marketplace for store products, vintage tech auctions, and professional services.",
};

import Navbar from "@/components/layout/Navbar";
import DynamicFooter from "@/components/layout/DynamicFooter";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-slate-900 bg-white`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="min-h-screen">
              {children}
            </main>
            <DynamicFooter />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
