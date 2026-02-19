import { createClient } from "@/lib/supabase/server";
import { getPlayers } from "@/lib/queries/players";
import { PlayerList } from "@/components/player-list";

export default async function PlayersPage() {
  const supabase = await createClient();
  const players = await getPlayers(supabase);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Jogadores</h1>
        <p className="mt-1 text-sm text-slate-500">
          {players.length} jogador{players.length !== 1 ? "es" : ""} cadastrado{players.length !== 1 ? "s" : ""}.
        </p>
      </div>
      <PlayerList initialPlayers={players} />
    </div>
  );
}
