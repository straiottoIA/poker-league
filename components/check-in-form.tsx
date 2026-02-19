"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { checkInPlayer } from "@/lib/queries/checkin";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/use-auth";
import Link from "next/link";

interface Player {
  id: string;
  name: string;
}

export function CheckInForm({
  seasonId,
  seasonName,
  weekNumber,
  players,
  checkedInPlayerIds,
}: {
  seasonId: string;
  seasonName: string;
  weekNumber: number;
  players: Player[];
  checkedInPlayerIds: string[];
}) {
  const [checkedIn, setCheckedIn] = useState<Set<string>>(
    new Set(checkedInPlayerIds)
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const handleCheckIn = async (playerId: string) => {
    setLoading(playerId);
    setError("");
    try {
      const supabase = createClient();
      await checkInPlayer(supabase, seasonId, playerId, weekNumber);
      setCheckedIn((prev) => new Set(prev).add(playerId));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer check-in. Tente novamente.");
    } finally {
      setLoading(null);
    }
  };

  if (players.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
        <p className="text-sm text-slate-400">Nenhum jogador inscrito nesta temporada.</p>
      </div>
    );
  }

  const checkedCount = checkedIn.size;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">
          {seasonName} &mdash; Semana {weekNumber}
        </p>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          {checkedCount}/{players.length} presentes
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Jogador
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {players.map((player) => {
              const isCheckedIn = checkedIn.has(player.id);
              const isLoading = loading === player.id;
              return (
                <tr key={player.id} className="transition-colors hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                    {player.name}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isCheckedIn ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                        Presente
                      </span>
                    ) : isLoggedIn ? (
                      <button
                        onClick={() => handleCheckIn(player.id)}
                        disabled={isLoading}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isLoading ? "..." : "Check-in"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-300">–</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 border border-red-100">{error}</p>
      )}
      {!isLoggedIn && (
        <p className="text-sm text-slate-500">
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">Faça login</Link> para registrar presenças.
        </p>
      )}
    </div>
  );
}
