"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/use-auth";

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
    <nav className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex h-16 items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
              TP
            </span>
            <span className="text-base font-bold text-slate-900 tracking-tight">TTPF</span>
          </Link>
          <div className="flex flex-1 items-stretch gap-0">
            {links.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex items-center px-3 py-5 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-indigo-600"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-indigo-600" />
                  )}
                </Link>
              );
            })}
          </div>
          <div className="flex items-stretch">
            {isLoggedIn ? (
              <div className="flex items-stretch gap-0">
                <Link
                  href="/perfil"
                  aria-current={pathname === "/perfil" ? "page" : undefined}
                  className={`relative flex items-center px-3 py-5 text-sm font-medium transition-colors ${
                    pathname === "/perfil"
                      ? "text-indigo-600"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Perfil
                  {pathname === "/perfil" && (
                    <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-indigo-600" />
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                <Link
                  href="/login"
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
