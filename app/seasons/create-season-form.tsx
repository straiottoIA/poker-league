"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createSeason } from "@/lib/queries/seasons";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/use-auth";
import Link from "next/link";

export function CreateSeasonForm() {
  const [name, setName] = useState("");
  const [numWeeks, setNumWeeks] = useState(10);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const safeWeeks = Math.max(1, Math.min(52, numWeeks));
      const season = await createSeason(supabase, name.trim(), safeWeeks);
      setName("");
      router.push(`/seasons/${season.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <p className="font-body text-sm text-secondary">
        <Link href="/login" className="font-bold text-ink underline hover:text-crimson">
          Faça login
        </Link>{" "}
        para criar uma temporada.
      </p>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        placeholder="Nome (ex: Primavera 2026)"
        className="flex-1 border border-border-strong bg-surface px-3 py-2.5 font-body text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
      />
      <input
        type="number"
        value={numWeeks}
        onChange={(e) => setNumWeeks(Number(e.target.value) || 10)}
        min={1}
        max={52}
        aria-label="Número de semanas"
        className="w-20 border border-border-strong bg-surface px-3 py-2.5 text-center font-body text-sm text-ink focus:border-ink focus:outline-none"
      />
      <button
        onClick={handleCreate}
        disabled={loading || !name.trim()}
        className="bg-ink px-6 py-2.5 font-body text-[11px] font-bold uppercase tracking-[2px] text-canvas transition-colors hover:bg-crimson disabled:opacity-50"
      >
        {loading ? "Criando..." : "Criar"}
      </button>
    </div>
  );
}
