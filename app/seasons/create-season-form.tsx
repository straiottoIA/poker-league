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
      <p className="text-sm text-slate-500">
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">Faça login</Link> para criar uma temporada.
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
        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      />
      <input
        type="number"
        value={numWeeks}
        onChange={(e) => setNumWeeks(Number(e.target.value) || 10)}
        min={1}
        max={52}
        aria-label="Número de semanas"
        className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-center text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      />
      <button
        onClick={handleCreate}
        disabled={loading || !name.trim()}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Criando..." : "Criar"}
      </button>
    </div>
  );
}
