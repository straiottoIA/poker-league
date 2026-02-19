"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/seasons", label: "Temporadas" },
  { href: "/players", label: "Jogadores" },
  { href: "/check-in", label: "Check-in" },
  { href: "/estatisticas", label: "Estatísticas" },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <nav className="border-b-2 border-ink bg-canvas">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link href="/" className="shrink-0 font-heading text-2xl font-bold tracking-[3px]">
            TTP<em className="not-italic text-crimson">F</em>
          </Link>

          {/* Nav links — scrollable on mobile, no scrollbar visible */}
          <div className="scrollbar-hide flex-1 overflow-x-auto">
            <div className="flex min-w-max items-center gap-6 px-1">
              {links.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`font-body text-[11px] font-bold uppercase tracking-[2px] transition-colors ${
                      isActive ? "text-crimson" : "text-ink hover:text-crimson"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Auth + Theme toggle */}
          <div className="flex shrink-0 items-center gap-4">
            <ThemeToggle />
            {isLoggedIn ? (
              <>
                <Link
                  href="/perfil"
                  aria-current={pathname === "/perfil" ? "page" : undefined}
                  className={`font-body text-[11px] font-bold uppercase tracking-[2px] transition-colors ${
                    pathname === "/perfil" ? "text-crimson" : "text-ink hover:text-crimson"
                  }`}
                >
                  Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="font-body text-[11px] font-bold uppercase tracking-[2px] text-secondary transition-colors hover:text-ink"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-ink px-5 py-2 font-body text-[11px] font-bold uppercase tracking-[2px] text-canvas transition-colors hover:bg-crimson"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
