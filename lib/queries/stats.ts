import { SupabaseClient } from "@supabase/supabase-js";
import { Season, AllTimePlayerStat, SeasonSummary } from "@/lib/supabase/types";
import { fromRoman } from "@/lib/queries/seasons";

type RawScore = {
  player_id: string;
  season_id: string;
  week_number: number;
  points: number;
  attended: boolean;
  players: { name: string } | null;
};

async function fetchAllScores(supabase: SupabaseClient): Promise<RawScore[]> {
  const PAGE = 1000;
  const all: RawScore[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("scores")
      .select("player_id, season_id, week_number, points, attended, players(name)")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as unknown as RawScore[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

export interface EstatisticasData {
  allTimeStats: AllTimePlayerStat[];
  seasonSummaries: SeasonSummary[];
  totalAttendances: number;
  totalWeeksPlayed: number;
}

export async function getEstatisticasData(
  supabase: SupabaseClient,
  seasons: Season[]
): Promise<EstatisticasData> {
  const scores = await fetchAllScores(supabase);

  // Ordenar temporadas cronologicamente (mais antiga primeiro) para o cálculo de attendance_pct.
  // getSeasons retorna decrescente (ativa primeiro), então reordenamos aqui.
  const seasonsByAge = [...seasons].sort(
    (a, b) => fromRoman(a.name) - fromRoman(b.name)
  );
  const seasonOrderMap = new Map<string, number>(
    seasonsByAge.map((s, i) => [s.id, i])
  );

  // Lista ordenada cronologicamente de todos os slots de semana jogados
  const allWeekSlotSet = new Set<string>();
  for (const s of scores) {
    allWeekSlotSet.add(`${s.season_id}|${s.week_number}`);
  }
  const allWeekSlots = [...allWeekSlotSet].sort((a, b) => {
    const [aSeasonId, aWeekStr] = a.split("|");
    const [bSeasonId, bWeekStr] = b.split("|");
    const seasonDiff =
      (seasonOrderMap.get(aSeasonId) ?? 0) - (seasonOrderMap.get(bSeasonId) ?? 0);
    if (seasonDiff !== 0) return seasonDiff;
    return parseInt(aWeekStr) - parseInt(bWeekStr);
  });

  type PlayerAcc = {
    name: string;
    total_points: number;
    attended_count: number;
    season_ids: Set<string>;
    slot_keys: Set<string>;
  };
  const playerAcc = new Map<string, PlayerAcc>();

  type SeasonPlayerAcc = { player_id: string; name: string; points: number };
  const seasonPlayerAcc = new Map<string, SeasonPlayerAcc>();

  // weekMap: slot → lista de { player_id, points } para calcular vitórias de etapa
  const weekMap = new Map<string, { player_id: string; points: number }[]>();

  for (const s of scores) {
    const name = s.players?.name ?? "?";
    const slotKey = `${s.season_id}|${s.week_number}`;

    // All-time accumulator
    const existing = playerAcc.get(s.player_id) ?? {
      name,
      total_points: 0,
      attended_count: 0,
      season_ids: new Set<string>(),
      slot_keys: new Set<string>(),
    };
    existing.total_points += s.points;
    if (s.attended) existing.attended_count += 1;
    existing.season_ids.add(s.season_id);
    existing.slot_keys.add(slotKey);
    playerAcc.set(s.player_id, existing);

    // Season-player accumulator (para vitórias de temporada e pódios)
    const spKey = `${s.season_id}|${s.player_id}`;
    const spExisting = seasonPlayerAcc.get(spKey) ?? { player_id: s.player_id, name, points: 0 };
    spExisting.points += s.points;
    seasonPlayerAcc.set(spKey, spExisting);

    // Week accumulator (para vitórias de etapa)
    const weekArr = weekMap.get(slotKey) ?? [];
    weekArr.push({ player_id: s.player_id, points: s.points });
    weekMap.set(slotKey, weekArr);
  }

  // Vitórias de etapa (week_wins): maior pontuação em cada (season, week)
  const weekWinsMap = new Map<string, number>();
  for (const [, players] of weekMap) {
    const maxPts = Math.max(...players.map((p) => p.points));
    if (maxPts <= 0) continue;
    for (const p of players) {
      if (p.points === maxPts) {
        weekWinsMap.set(p.player_id, (weekWinsMap.get(p.player_id) ?? 0) + 1);
      }
    }
  }

  // Vitórias de temporada (season_wins) e pódios
  const seasonWinsMap = new Map<string, number>();
  const podiumsMap = new Map<string, number>();

  const bySeason = new Map<string, SeasonPlayerAcc[]>();
  for (const [key, acc] of seasonPlayerAcc) {
    const seasonId = key.split("|")[0];
    const arr = bySeason.get(seasonId) ?? [];
    arr.push(acc);
    bySeason.set(seasonId, arr);
  }

  for (const [, players] of bySeason) {
    const sorted = [...players].sort((a, b) => b.points - a.points);
    const rank1pts = sorted[0]?.points ?? -1;
    const rank3pts = sorted[2]?.points ?? -1;

    for (const p of sorted) {
      if (p.points > 0 && p.points === rank1pts) {
        seasonWinsMap.set(p.player_id, (seasonWinsMap.get(p.player_id) ?? 0) + 1);
      }
      const inPodium =
        sorted.length >= 3
          ? p.points >= rank3pts && rank3pts > 0
          : p.points > 0;
      if (inPodium) {
        podiumsMap.set(p.player_id, (podiumsMap.get(p.player_id) ?? 0) + 1);
      }
    }
  }

  // Montar AllTimePlayerStat[] com attendance_pct corrigido
  const allTimeStats: AllTimePlayerStat[] = Array.from(playerAcc.entries())
    .map(([pid, acc]) => {
      // Encontrar o índice do primeiro slot cronológico do jogador
      let firstSlotIdx = allWeekSlots.length;
      for (let i = 0; i < allWeekSlots.length; i++) {
        if (acc.slot_keys.has(allWeekSlots[i])) {
          firstSlotIdx = i;
          break;
        }
      }
      const total_since_first = allWeekSlots.length - firstSlotIdx;

      return {
        player_id: pid,
        player_name: acc.name,
        total_points: parseFloat(acc.total_points.toFixed(2)),
        weeks_attended: acc.attended_count,
        total_weeks: total_since_first,
        attendance_pct:
          total_since_first > 0
            ? Math.round((acc.attended_count / total_since_first) * 100)
            : 0,
        seasons_played: acc.season_ids.size,
        season_wins: seasonWinsMap.get(pid) ?? 0,
        week_wins: weekWinsMap.get(pid) ?? 0,
        podiums: podiumsMap.get(pid) ?? 0,
        avg_points:
          acc.attended_count > 0
            ? parseFloat((acc.total_points / acc.attended_count).toFixed(2))
            : 0,
      };
    })
    .sort((a, b) => b.total_points - a.total_points);

  // Montar SeasonSummary[]
  const seasonSummaries: SeasonSummary[] = seasons.map((season) => {
    const seasonScores = scores.filter((s) => s.season_id === season.id);
    const weeksSet = new Set(seasonScores.map((s) => s.week_number));
    const attended = seasonScores.filter((s) => s.attended);

    const perPlayer = new Map<string, { name: string; points: number }>();
    for (const s of seasonScores) {
      const name = s.players?.name ?? "?";
      const cur = perPlayer.get(s.player_id) ?? { name, points: 0 };
      cur.points += s.points;
      perPlayer.set(s.player_id, cur);
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
      season_id: season.id,
      season_name: season.name,
      is_active: season.is_active,
      num_weeks: season.num_weeks,
      weeks_played: weeksSet.size,
      total_attendances: attended.length,
      top_player: topPlayer,
      top_points: parseFloat(topPoints.toFixed(2)),
    };
  });

  const totalAttendances = scores.filter((s) => s.attended).length;
  const uniqueWeeks = new Set(scores.map((s) => `${s.season_id}-${s.week_number}`));

  return {
    allTimeStats,
    seasonSummaries,
    totalAttendances,
    totalWeeksPlayed: uniqueWeeks.size,
  };
}
