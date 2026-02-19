import { createClient } from "@/lib/supabase/server";
import { getSeasons } from "@/lib/queries/seasons";
import type { Season } from "@/lib/supabase/types";

interface PlayerStat {
  player_id: string;
  player_name: string;
  total_points: number;
  weeks_attended: number;
  seasons_played: number;
}

interface SeasonSummary {
  season: Season;
  total_attendances: number;
  weeks_played: number;
  top_player: string | null;
  top_points: number;
}

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

export default async function EstatisticasPage() {
  const supabase = await createClient();

  const [seasons, playersRes, scoresRes] = await Promise.all([
    getSeasons(supabase),
    supabase.from("players").select("id, name"),
    supabase
      .from("scores")
      .select("player_id, season_id, week_number, points, attended, players(name)")
      .limit(5000),
  ]);

  const players = playersRes.data ?? [];
  const scores = scoresRes.data ?? [];

  // ── Totais gerais ──
  const totalAttendances = scores.filter((s) => s.attended).length;
  const uniqueWeeks = new Set(scores.map((s) => `${s.season_id}-${s.week_number}`));
  const totalWeeksPlayed = uniqueWeeks.size;
  const activeSeason = seasons.find((s) => s.is_active) ?? null;

  // ── Ranking geral (all-time) ──
  const playerMap = new Map<
    string,
    { name: string; points: number; weeks: number; seasons: Set<string> }
  >();

  for (const score of scores) {
    const pid = score.player_id as string;
    const name = (score.players as { name: string }).name;
    const existing = playerMap.get(pid) ?? {
      name,
      points: 0,
      weeks: 0,
      seasons: new Set<string>(),
    };
    existing.points += score.points as number;
    if (score.attended) existing.weeks += 1;
    existing.seasons.add(score.season_id as string);
    playerMap.set(pid, existing);
  }

  const allTimeRanking: PlayerStat[] = Array.from(playerMap.entries())
    .map(([pid, info]) => ({
      player_id: pid,
      player_name: info.name,
      total_points: info.points,
      weeks_attended: info.weeks,
      seasons_played: info.seasons.size,
    }))
    .sort((a, b) => b.total_points - a.total_points);

  // ── Resumo por temporada ──
  const seasonSummaries: SeasonSummary[] = seasons.map((season) => {
    const seasonScores = scores.filter((s) => s.season_id === season.id);
    const attended = seasonScores.filter((s) => s.attended);
    const weeksSet = new Set(seasonScores.map((s) => s.week_number));

    const perPlayer = new Map<string, { name: string; points: number }>();
    for (const s of seasonScores) {
      const pid = s.player_id as string;
      const name = (s.players as { name: string }).name;
      const cur = perPlayer.get(pid) ?? { name, points: 0 };
      cur.points += s.points as number;
      perPlayer.set(pid, cur);
    }

    let topPlayer: string | null = null;
    let topPoints = 0;
    for (const [, info] of perPlayer) {
      if (info.points > topPoints) {
        topPoints = info.points;
        topPlayer = info.name;
      }
    }

    return {
      season,
      total_attendances: attended.length,
      weeks_played: weeksSet.size,
      top_player: topPlayer,
      top_points: topPoints,
    };
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Estatísticas</h1>
        <p className="mt-1 text-sm text-slate-500">Visão geral da liga e histórico completo.</p>
      </div>

      {/* ── Cards gerais ── */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Visão Geral
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Temporadas" value={seasons.length} color="indigo" />
          <StatCard label="Jogadores" value={players.length} color="violet" />
          <StatCard label="Semanas Jogadas" value={totalWeeksPlayed} color="sky" />
          <StatCard label="Presenças Totais" value={totalAttendances} color="emerald" />
        </div>
        {activeSeason && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                Temporada Ativa
              </span>
              <p className="mt-0.5 text-base font-bold text-emerald-900">
                {activeSeason.name}
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              {activeSeason.num_weeks} semanas
            </span>
          </div>
        )}
      </section>

      {/* ── Ranking geral ── */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Ranking Geral (All-Time)
        </h2>
        {allTimeRanking.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">Nenhuma pontuação registrada ainda.</p>
          </div>
        ) : (
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
                    Presenças
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Temporadas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {allTimeRanking.map((entry, i) => (
                  <tr
                    key={entry.player_id}
                    className={`transition-colors hover:bg-slate-50 ${
                      i === 0 ? "bg-amber-50/60" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <RankBadge rank={i + 1} />
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
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-400">
                      {entry.seasons_played}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Por temporada ── */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Por Temporada
        </h2>
        {seasonSummaries.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">Nenhuma temporada encontrada.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Temporada
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Semanas
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Presenças
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Melhor Jogador
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {seasonSummaries.map(({ season, total_attendances, weeks_played, top_player, top_points }) => (
                  <tr key={season.id} className="transition-colors hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        {season.name}
                        {season.is_active && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            Ativa
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-500">
                      {weeks_played}/{season.num_weeks}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-500">
                      {total_attendances}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">
                      {top_player ? (
                        <span>
                          {top_player}
                          <span className="ml-1.5 text-xs font-medium text-indigo-500">
                            {top_points} pts
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

type StatColor = "indigo" | "violet" | "sky" | "emerald";

function StatCard({ label, value, color = "indigo" }: { label: string; value: number; color?: StatColor }) {
  const colors: Record<StatColor, string> = {
    indigo: "text-indigo-600",
    violet: "text-violet-600",
    sky: "text-sky-600",
    emerald: "text-emerald-600",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1.5 text-3xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
}
