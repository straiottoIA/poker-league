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
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
        <p className="text-sm text-slate-400">Nenhum jogador inscrito ainda.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr>
            <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Jogador
            </th>
            {weeks.map((w) => (
              <th
                key={w}
                className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400"
              >
                <Link
                  href={`/seasons/${seasonId}/week/${w}`}
                  className="text-indigo-500 hover:text-indigo-700 transition-colors"
                >
                  S{w}
                </Link>
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {players.map((player) => {
            const total = weeks.reduce((sum, w) => {
              const score = scoreMap.get(`${player.id}-${w}`);
              return sum + (score ? Number(score.points) : 0);
            }, 0);

            return (
              <tr key={player.id} className="hover:bg-slate-50 transition-colors">
                <td className="sticky left-0 z-10 bg-white whitespace-nowrap px-4 py-2.5 text-sm font-medium text-slate-900">
                  {player.name}
                </td>
                {weeks.map((w) => {
                  const score = scoreMap.get(`${player.id}-${w}`);
                  const attended = score?.attended;
                  return (
                    <td
                      key={w}
                      className={`whitespace-nowrap px-3 py-2.5 text-center text-sm ${
                        score
                          ? attended
                            ? "font-medium text-emerald-700"
                            : "text-slate-400"
                          : "text-slate-200"
                      }`}
                    >
                      {score ? Number(score.points) : "–"}
                    </td>
                  );
                })}
                <td className="whitespace-nowrap px-4 py-2.5 text-right text-sm font-bold text-indigo-600">
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
