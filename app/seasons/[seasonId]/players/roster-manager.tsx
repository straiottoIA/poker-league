"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { enrollPlayer, unenrollPlayer } from "@/lib/queries/roster";
import { Player } from "@/lib/supabase/types";
import { useAuth } from "@/lib/supabase/use-auth";
import Link from "next/link";

export function RosterManager({
  seasonId,
  allPlayers,
  initialEnrolledIds,
}: {
  seasonId: string;
  allPlayers: Player[];
  initialEnrolledIds: string[];
}) {
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(
    new Set(initialEnrolledIds)
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { isLoggedIn } = useAuth();

  const handleToggle = async (playerId: string) => {
    setLoading(playerId);
    setError("");
    const supabase = createClient();
    const isEnrolled = enrolledIds.has(playerId);

    try {
      if (isEnrolled) {
        await unenrollPlayer(supabase, seasonId, playerId);
        setEnrolledIds((prev) => {
          const next = new Set(prev);
          next.delete(playerId);
          return next;
        });
      } else {
        await enrollPlayer(supabase, seasonId, playerId);
        setEnrolledIds((prev) => new Set(prev).add(playerId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar roster. Tente novamente.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
        {allPlayers.map((player) => (
          <li key={player.id} className="flex items-center gap-3 px-4 py-3">
            <input
              id={`roster-${player.id}`}
              type="checkbox"
              checked={enrolledIds.has(player.id)}
              onChange={() => handleToggle(player.id)}
              disabled={!isLoggedIn || loading === player.id}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label
              htmlFor={`roster-${player.id}`}
              className="text-sm font-medium text-gray-900 cursor-pointer"
            >
              {player.name}
            </label>
            {loading === player.id && (
              <span className="text-xs text-gray-400">salvando...</span>
            )}
          </li>
        ))}
      </ul>
      {!isLoggedIn && (
        <p className="text-sm text-gray-500">
          <Link href="/login" className="text-blue-600 hover:underline">Login</Link> to manage the roster.
        </p>
      )}
    </div>
  );
}
