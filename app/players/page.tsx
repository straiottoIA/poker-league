import { createClient } from "@/lib/supabase/server";
import { getPlayers } from "@/lib/queries/players";
import { getSeasons } from "@/lib/queries/seasons";
import { getEstatisticasData } from "@/lib/queries/stats";
import { PlayerGrid, type PlayerWithStats } from "@/components/player-grid";

export default async function PlayersPage() {
  const supabase = await createClient();

  const [players, seasons] = await Promise.all([
    getPlayers(supabase),
    getSeasons(supabase),
  ]);

  const { allTimeStats } = await getEstatisticasData(supabase, seasons);

  const statsMap = new Map(allTimeStats.map((s) => [s.player_id, s]));

  const playersWithStats: PlayerWithStats[] = players.map((p) => {
    const stats = statsMap.get(p.id);
    return {
      id: p.id,
      name: p.name,
      total_points: stats?.total_points ?? null,
      season_wins: stats?.season_wins ?? null,
    };
  });

  return (
    <div className="space-y-10">
      <div className="border-b-2 border-ink pb-6">
        <p className="font-body text-[11px] font-bold uppercase tracking-[5px] text-crimson">Liga</p>
        <h1 className="mt-2 font-heading text-4xl font-bold text-ink">Jogadores</h1>
        <p className="mt-2 font-body text-sm text-secondary">
          {players.length} jogador{players.length !== 1 ? "es" : ""} cadastrado{players.length !== 1 ? "s" : ""}.
        </p>
      </div>
      <PlayerGrid initialPlayers={playersWithStats} />
    </div>
  );
}
