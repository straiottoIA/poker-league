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
      <p className="text-sm text-gray-500">
        <Link href="/login" className="text-blue-600 hover:underline">Login</Link> to create a season.
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
        placeholder="Season name (e.g. Spring 2026)"
        className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
      />
      <input
        type="number"
        value={numWeeks}
        onChange={(e) => setNumWeeks(Number(e.target.value) || 10)}
        min={1}
        max={52}
        className="w-20 rounded border border-gray-300 px-3 py-2 text-sm text-center"
      />
      <button
        onClick={handleCreate}
        disabled={loading || !name.trim()}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Create
      </button>
    </div>
  );
}
