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
      <div className="border border-border-strong bg-surface px-8 py-12 text-center">
        <p className="font-body text-sm text-muted">Nenhum jogador inscrito nesta temporada.</p>
      </div>
    );
  }

  const checkedCount = checkedIn.size;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-secondary">
          {seasonName} — Semana {weekNumber}
        </p>
        <span className="border border-border-strong px-3 py-1 font-body text-[10px] font-bold uppercase tracking-[2px] text-secondary">
          {checkedCount}/{players.length} presentes
        </span>
      </div>

      <div className="overflow-hidden border border-border-strong bg-surface">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-border-strong bg-canvas">
              <th className="px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Jogador</th>
              <th className="px-5 py-3 text-center font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Status</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => {
              const isCheckedIn = checkedIn.has(player.id);
              const isLoading = loading === player.id;
              return (
                <tr key={player.id} className="border-b border-border-subtle transition-colors hover:bg-canvas/40">
                  <td className="whitespace-nowrap px-5 py-3.5 font-body text-sm font-medium text-ink">
                    {player.name}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {isCheckedIn ? (
                      <span className="font-body text-[11px] font-bold uppercase tracking-[2px] text-crimson">
                        ✓ Presente
                      </span>
                    ) : isLoggedIn ? (
                      <button
                        onClick={() => handleCheckIn(player.id)}
                        disabled={isLoading}
                        className="bg-ink px-4 py-1.5 font-body text-[10px] font-bold uppercase tracking-[2px] text-canvas transition-colors hover:bg-crimson disabled:opacity-50"
                      >
                        {isLoading ? "..." : "Check-in"}
                      </button>
                    ) : (
                      <span className="font-body text-xs text-muted">–</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && (
        <p className="border border-crimson/20 bg-tint-crimson px-4 py-2.5 font-body text-sm text-crimson">
          {error}
        </p>
      )}
      {!isLoggedIn && (
        <p className="font-body text-sm text-secondary">
          <Link href="/login" className="font-bold text-ink underline hover:text-crimson">Faça login</Link>{" "}
          para registrar presenças.
        </p>
      )}
    </div>
  );
}
