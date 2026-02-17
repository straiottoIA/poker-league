import type { Metadata } from "next";
import { NavBar } from "@/components/nav-bar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poker League Tracker",
  description: "Track weekly attendance and points for your poker league",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <NavBar />
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
