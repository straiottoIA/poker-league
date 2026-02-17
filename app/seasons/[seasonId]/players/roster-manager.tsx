"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { enrollPlayer, unenrollPlayer } from "@/lib/queries/roster";
import { Player } from "@/lib/supabase/types";

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

  const handleToggle = async (playerId: string) => {
    setLoading(playerId);
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
      alert(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
      {allPlayers.map((player) => (
        <li key={player.id} className="flex items-center gap-3 px-4 py-3">
          <input
            type="checkbox"
            checked={enrolledIds.has(player.id)}
            onChange={() => handleToggle(player.id)}
            disabled={loading === player.id}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm font-medium text-gray-900">
            {player.name}
          </span>
          {loading === player.id && (
            <span className="text-xs text-gray-400">saving...</span>
          )}
        </li>
      ))}
    </ul>
  );
}
