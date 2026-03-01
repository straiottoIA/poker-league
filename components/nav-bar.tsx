"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/seasons", label: "Temporadas" },
  { href: "/players", label: "Jogadores" },
  { href: "/check-in", label: "Check-in" },
  { href: "/estatisticas", label: "Estatísticas" },
  { href: "/hall-da-fama", label: "Hall da Fama" },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Fecha o menu ao navegar
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <nav className={`sticky top-0 z-40 border-b border-border-strong bg-canvas/80 backdrop-blur-md transition-shadow duration-200 ${scrolled ? "shadow-[var(--shadow-md)]" : "shadow-none"}`}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Barra principal */}
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link href="/" className="shrink-0 font-heading text-2xl font-bold tracking-[3px]">
            TTP<em className="not-italic text-crimson">F</em>
          </Link>

          {/* Links desktop */}
          <div className="hidden flex-1 items-center gap-6 sm:flex">
            {links.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative font-body text-[11px] font-bold uppercase tracking-[2px] transition-colors ${
                    isActive
                      ? "text-crimson after:absolute after:bottom-[-1px] after:left-0 after:h-0.5 after:w-full after:bg-crimson"
                      : "text-ink hover:text-crimson"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Espaço no mobile */}
          <div className="flex-1 sm:hidden" />

          {/* Auth + Theme + botão mobile */}
          <div className="flex shrink-0 items-center gap-4">
            <ThemeToggle />

            {/* Auth — visível só no desktop */}
            {isLoggedIn ? (
              <>
                <Link
                  href="/perfil"
                  aria-current={pathname === "/perfil" ? "page" : undefined}
                  className={`hidden font-body text-[11px] font-bold uppercase tracking-[2px] transition-colors sm:block ${
                    pathname === "/perfil" ? "text-crimson" : "text-ink hover:text-crimson"
                  }`}
                >
                  Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden font-body text-[11px] font-bold uppercase tracking-[2px] text-secondary transition-colors hover:text-ink sm:block"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="hidden bg-ink px-5 py-2 font-body text-[11px] font-bold uppercase tracking-[2px] text-canvas transition-colors hover:bg-crimson sm:block"
              >
                Login
              </Link>
            )}

            {/* Botão de menu mobile (seta) */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              className="flex items-center justify-center sm:hidden"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 text-ink transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown mobile */}
      {menuOpen && (
        <div className="border-t border-border-strong bg-canvas sm:hidden">
          <div className="mx-auto max-w-5xl divide-y divide-border-subtle px-4">
            {links.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-2 py-4 font-body text-[11px] font-bold uppercase tracking-[2px] transition-colors ${
                    isActive ? "text-crimson" : "text-ink hover:text-crimson"
                  }`}
                >
                  {isActive && <span className="text-crimson">▸</span>}
                  {link.label}
                </Link>
              );
            })}

            {/* Auth no mobile */}
            <div className="py-4">
              {isLoggedIn ? (
                <div className="flex items-center gap-6">
                  <Link
                    href="/perfil"
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
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-block bg-ink px-5 py-2 font-body text-[11px] font-bold uppercase tracking-[2px] text-canvas transition-colors hover:bg-crimson"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
