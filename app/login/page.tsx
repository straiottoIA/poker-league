"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: `${username.trim().toLowerCase()}@ttpf.local`,
        password,
      });

      if (error) {
        setError("Usuário ou senha incorretos.");
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="font-heading text-4xl font-bold tracking-[3px]">
            TTP<em className="not-italic text-crimson">F</em>
          </p>
          <p className="mt-3 font-body text-[11px] font-bold uppercase tracking-[5px] text-muted">
            Acesso Administrativo
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl bg-surface px-8 py-10 shadow-[var(--shadow-lg)]">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
                Usuário
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                autoCapitalize="none"
                className="mt-2 block w-full rounded-md border border-border-strong bg-canvas px-3 py-2.5 font-body text-sm text-ink focus:border-crimson focus:bg-surface focus:outline-none focus:ring-2 focus:ring-crimson/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="block font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="mt-2 block w-full rounded-md border border-border-strong bg-canvas px-3 py-2.5 font-body text-sm text-ink focus:border-crimson focus:bg-surface focus:outline-none focus:ring-2 focus:ring-crimson/20"
              />
            </div>

            {error && (
              <p className="border border-crimson/20 bg-tint-crimson px-4 py-2.5 font-body text-sm text-crimson">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-crimson py-3 font-body text-[11px] font-bold uppercase tracking-[2px] text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#c62828] hover:shadow-[var(--shadow-md)] disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center font-body text-[11px] text-muted">
          Onde cada mão conta uma história.
        </p>
      </div>
    </div>
  );
}
