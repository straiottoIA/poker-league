import { Player, Score } from "@/lib/supabase/types";
import Link from "next/link";

interface SeasonGridProps {
  seasonId: string;
  players: Player[];
  scores: Score[];
  numWeeks: number;
}

export function SeasonGrid({
  seasonId,
  players,
  scores,
  numWeeks,
}: SeasonGridProps) {
  const scoreMap = new Map<string, Score>();
  for (const s of scores) {
    scoreMap.set(`${s.player_id}-${s.week_number}`, s);
  }

  const weeks = Array.from({ length: numWeeks }, (_, i) => i + 1);

  if (players.length === 0) {
    return <p className="text-gray-500 text-sm">No players enrolled yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
              Player
            </th>
            {weeks.map((w) => (
              <th
                key={w}
                className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500"
              >
                <Link
                  href={`/seasons/${seasonId}/week/${w}`}
                  className="text-blue-600 hover:underline"
                >
                  W{w}
                </Link>
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {players.map((player) => {
            const total = weeks.reduce((sum, w) => {
              const score = scoreMap.get(`${player.id}-${w}`);
              return sum + (score ? Number(score.points) : 0);
            }, 0);

            return (
              <tr key={player.id}>
                <td className="sticky left-0 z-10 bg-white whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-900">
                  {player.name}
                </td>
                {weeks.map((w) => {
                  const score = scoreMap.get(`${player.id}-${w}`);
                  return (
                    <td
                      key={w}
                      className={`whitespace-nowrap px-3 py-2 text-center text-sm ${
                        score
                          ? score.attended
                            ? "text-gray-900"
                            : "text-gray-400"
                          : "text-gray-300"
                      }`}
                    >
                      {score ? Number(score.points) : "-"}
                    </td>
                  );
                })}
                <td className="whitespace-nowrap px-4 py-2 text-right text-sm font-semibold text-gray-900">
                  {total}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
