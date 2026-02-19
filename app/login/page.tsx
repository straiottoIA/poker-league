"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
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
        email,
        password,
      });

      if (error) {
        setError(error.message);
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
        <div className="border-2 border-ink bg-white px-8 py-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-2 block w-full border border-[rgba(26,26,26,0.2)] bg-canvas px-3 py-2.5 font-body text-sm text-ink focus:border-ink focus:bg-white focus:outline-none"
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
                className="mt-2 block w-full border border-[rgba(26,26,26,0.2)] bg-canvas px-3 py-2.5 font-body text-sm text-ink focus:border-ink focus:bg-white focus:outline-none"
              />
            </div>

            {error && (
              <p className="border border-crimson/20 bg-[rgba(229,57,53,0.05)] px-4 py-2.5 font-body text-sm text-crimson">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-crimson py-3 font-body text-[11px] font-bold uppercase tracking-[2px] text-white transition-colors hover:bg-[#c62828] disabled:opacity-50"
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
