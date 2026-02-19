import type { Metadata } from "next";
import { Libre_Baskerville, DM_Sans } from "next/font/google";
import { NavBar } from "@/components/nav-bar";
import "./globals.css";

const libreBaskerville = Libre_Baskerville({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const dmSans = DM_Sans({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TTPF — Tip Total Poker Friends",
  description: "Onde cada mão conta uma história. Brasília, DF — Est. 2010",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${libreBaskerville.variable} ${dmSans.variable} min-h-screen bg-canvas text-ink antialiased`}>
        <NavBar />
        <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
