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
      <h1 className="text-2xl font-bold text-gray-900">Estatísticas</h1>

      {/* ── Cards gerais ── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Visão Geral
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Temporadas" value={seasons.length} />
          <StatCard label="Jogadores" value={players.length} />
          <StatCard label="Semanas Jogadas" value={totalWeeksPlayed} />
          <StatCard label="Presenças Totais" value={totalAttendances} />
        </div>
        {activeSeason && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
            <span className="text-xs font-medium uppercase tracking-wide text-green-600">
              Temporada Ativa
            </span>
            <p className="mt-0.5 font-semibold text-green-800">
              {activeSeason.name}
              <span className="ml-2 text-sm font-normal text-green-600">
                · {activeSeason.num_weeks} semanas
              </span>
            </p>
          </div>
        )}
      </section>

      {/* ── Ranking geral ── */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Ranking Geral (All-Time)
        </h2>
        {allTimeRanking.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma pontuação registrada ainda.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Jogador
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    Pontos
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    Presenças
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    Temporadas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {allTimeRanking.map((entry, i) => (
                  <tr
                    key={entry.player_id}
                    className={i < 3 ? "bg-yellow-50/40" : undefined}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-500">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {entry.player_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      {entry.total_points}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">
                      {entry.weeks_attended}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">
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
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Por Temporada
        </h2>
        {seasonSummaries.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma temporada encontrada.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Temporada
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    Semanas
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    Presenças
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Melhor Jogador
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {seasonSummaries.map(({ season, total_attendances, weeks_played, top_player, top_points }) => (
                  <tr key={season.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {season.name}
                        {season.is_active && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Ativa
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">
                      {weeks_played}/{season.num_weeks}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">
                      {total_attendances}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {top_player ? (
                        <span>
                          {top_player}
                          <span className="ml-1.5 text-xs text-gray-400">
                            {top_points} pts
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
