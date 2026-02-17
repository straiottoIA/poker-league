"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { checkInPlayer } from "@/lib/queries/checkin";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const handleCheckIn = async (playerId: string) => {
    setLoading(playerId);
    try {
      const supabase = createClient();
      await checkInPlayer(supabase, seasonId, playerId, weekNumber);
      setCheckedIn((prev) => new Set(prev).add(playerId));
      router.refresh();
    } catch {
      // silently fail — state stays unchanged
    } finally {
      setLoading(null);
    }
  };

  if (players.length === 0) {
    return <p className="text-gray-500 text-sm">No players enrolled in this season.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {seasonName} &mdash; Week {weekNumber}
      </p>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Player
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {players.map((player) => {
              const isCheckedIn = checkedIn.has(player.id);
              const isLoading = loading === player.id;
              return (
                <tr key={player.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {player.name}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isCheckedIn ? (
                      <span className="inline-flex items-center text-green-600 text-sm font-medium">
                        &#10003; Checked in
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCheckIn(player.id)}
                        disabled={isLoading}
                        className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isLoading ? "..." : "Check In"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
