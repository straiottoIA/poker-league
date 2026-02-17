import { LeaderboardEntry } from "@/lib/supabase/types";

export function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-gray-500 text-sm">No scores recorded yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
              Rank
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
              Player
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
              Points
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
              Weeks
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {entries.map((entry) => (
            <tr key={entry.player_id}>
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                {entry.rank}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                {entry.player_name}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-900">
                {entry.total_points}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">
                {entry.weeks_attended}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
