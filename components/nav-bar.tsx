"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/seasons", label: "Seasons" },
  { href: "/players", label: "Players" },
  { href: "/check-in", label: "Check-in" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex h-14 items-center gap-8">
          <Link href="/" className="text-lg font-bold text-gray-900">
            TTPF
          </Link>
          <div className="flex gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
