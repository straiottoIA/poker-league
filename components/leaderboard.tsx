import { LeaderboardEntry } from "@/lib/supabase/types";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
        3
      </span>
    );
  return <span className="text-sm text-slate-400">{rank}</span>;
}

export function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
        <p className="text-sm text-slate-400">Nenhuma pontuação registrada ainda.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Jogador
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
              Pontos
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
              Semanas
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {entries.map((entry) => (
            <tr
              key={entry.player_id}
              className={`transition-colors hover:bg-slate-50 ${
                entry.rank === 1 ? "bg-amber-50/60" : ""
              }`}
            >
              <td className="whitespace-nowrap px-4 py-3">
                <RankBadge rank={entry.rank} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                {entry.player_name}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-indigo-600">
                {entry.total_points}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-400">
                {entry.weeks_attended}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
