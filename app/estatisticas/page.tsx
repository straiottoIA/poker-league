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

  const totalAttendances = scores.filter((s) => s.attended).length;
  const uniqueWeeks = new Set(scores.map((s) => `${s.season_id}-${s.week_number}`));
  const totalWeeksPlayed = uniqueWeeks.size;
  const activeSeason = seasons.find((s) => s.is_active) ?? null;

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
    <div className="space-y-12">
      {/* Header */}
      <div className="border-b-2 border-ink pb-6">
        <p className="font-body text-[11px] font-bold uppercase tracking-[5px] text-crimson">Liga</p>
        <h1 className="mt-2 font-heading text-4xl font-bold text-ink">Estatísticas</h1>
      </div>

      {/* Stat bar */}
      <section>
        <p className="mb-4 font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Visão Geral</p>
        <div className="grid grid-cols-2 border border-[rgba(26,26,26,0.15)] bg-white sm:grid-cols-4">
          <StatBar label="Temporadas" value={seasons.length} />
          <StatBar label="Jogadores" value={players.length} />
          <StatBar label="Semanas" value={totalWeeksPlayed} />
          <StatBar label="Presenças" value={totalAttendances} last />
        </div>
        {activeSeason && (
          <div className="mt-4 flex items-center justify-between border-l-4 border-crimson bg-white px-6 py-4 border border-[rgba(26,26,26,0.1)]">
            <div>
              <p className="font-body text-[10px] font-bold uppercase tracking-[3px] text-crimson">
                Temporada Ativa
              </p>
              <p className="mt-1 font-heading text-xl font-bold text-ink">{activeSeason.name}</p>
            </div>
            <span className="bg-crimson px-3 py-1 font-body text-[10px] font-bold uppercase tracking-[2px] text-white">
              {activeSeason.num_weeks} sem.
            </span>
          </div>
        )}
      </section>

      {/* Ranking all-time */}
      <section>
        <div className="mb-4 flex items-center gap-3 border-b border-[rgba(26,26,26,0.12)] pb-3">
          <span className="font-body text-[10px] font-bold text-crimson">♠</span>
          <h2 className="font-heading text-2xl font-bold text-ink">Ranking All-Time</h2>
        </div>
        {allTimeRanking.length === 0 ? (
          <div className="border border-[rgba(26,26,26,0.15)] bg-white px-8 py-12 text-center">
            <p className="font-body text-sm text-muted">Nenhuma pontuação registrada ainda.</p>
          </div>
        ) : (
          <div className="overflow-hidden border border-[rgba(26,26,26,0.15)] bg-white">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-[rgba(26,26,26,0.15)] bg-canvas">
                  <th className="px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">#</th>
                  <th className="px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Jogador</th>
                  <th className="px-5 py-3 text-right font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Pontos</th>
                  <th className="px-5 py-3 text-right font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Presenças</th>
                  <th className="px-5 py-3 text-right font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Temporadas</th>
                </tr>
              </thead>
              <tbody>
                {allTimeRanking.map((entry, i) => (
                  <tr
                    key={entry.player_id}
                    className={`border-b border-[rgba(26,26,26,0.08)] transition-colors hover:bg-canvas/60 ${
                      i === 0 ? "bg-[rgba(229,57,53,0.04)]" : ""
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      {i < 3 ? (
                        <span className="bg-crimson px-1.5 py-0.5 font-body text-[10px] font-bold text-white">
                          {i + 1}°
                        </span>
                      ) : (
                        <span className="font-body text-sm text-muted">{i + 1}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-body text-sm font-medium text-ink">{entry.player_name}</td>
                    <td className="px-5 py-3.5 text-right font-heading text-lg font-bold text-crimson">{entry.total_points}</td>
                    <td className="px-5 py-3.5 text-right font-body text-sm text-muted">{entry.weeks_attended}</td>
                    <td className="px-5 py-3.5 text-right font-body text-sm text-muted">{entry.seasons_played}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Por temporada */}
      <section>
        <div className="mb-4 flex items-center gap-3 border-b border-[rgba(26,26,26,0.12)] pb-3">
          <span className="font-body text-[10px] font-bold text-crimson">♣</span>
          <h2 className="font-heading text-2xl font-bold text-ink">Por Temporada</h2>
        </div>
        {seasonSummaries.length === 0 ? (
          <div className="border border-[rgba(26,26,26,0.15)] bg-white px-8 py-12 text-center">
            <p className="font-body text-sm text-muted">Nenhuma temporada encontrada.</p>
          </div>
        ) : (
          <div className="overflow-hidden border border-[rgba(26,26,26,0.15)] bg-white">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-[rgba(26,26,26,0.15)] bg-canvas">
                  <th className="px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Temporada</th>
                  <th className="px-5 py-3 text-right font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Semanas</th>
                  <th className="px-5 py-3 text-right font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Presenças</th>
                  <th className="px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">Melhor Jogador</th>
                </tr>
              </thead>
              <tbody>
                {seasonSummaries.map(({ season, total_attendances, weeks_played, top_player, top_points }) => (
                  <tr key={season.id} className="border-b border-[rgba(26,26,26,0.08)] transition-colors hover:bg-canvas/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="font-body text-sm font-medium text-ink">{season.name}</span>
                        {season.is_active && (
                          <span className="bg-crimson px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-[2px] text-white">
                            Ativa
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-body text-sm text-secondary">
                      {weeks_played}/{season.num_weeks}
                    </td>
                    <td className="px-5 py-3.5 text-right font-body text-sm text-secondary">{total_attendances}</td>
                    <td className="px-5 py-3.5 font-body text-sm text-ink">
                      {top_player ? (
                        <>
                          {top_player}
                          <span className="ml-2 font-body text-[11px] font-bold text-crimson">{top_points} pts</span>
                        </>
                      ) : (
                        <span className="text-muted">—</span>
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

function StatBar({ label, value, last }: { label: string; value: number; last?: boolean }) {
  return (
    <div className={`p-8 text-center ${!last ? "border-r border-[rgba(26,26,26,0.1)]" : ""}`}>
      <p className="font-heading text-[32px] font-bold text-crimson">{value}</p>
      <p className="mt-1.5 font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">{label}</p>
    </div>
  );
}
