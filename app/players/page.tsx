import { createClient } from "@/lib/supabase/server";
import { getPlayers } from "@/lib/queries/players";
import { PlayerList } from "@/components/player-list";

export default async function PlayersPage() {
  const supabase = await createClient();
  const players = await getPlayers(supabase);

  return (
    <div className="space-y-10">
      <div className="border-b-2 border-ink pb-6">
        <p className="font-body text-[11px] font-bold uppercase tracking-[5px] text-crimson">Liga</p>
        <h1 className="mt-2 font-heading text-4xl font-bold text-ink">Jogadores</h1>
        <p className="mt-2 font-body text-sm text-secondary">
          {players.length} jogador{players.length !== 1 ? "es" : ""} cadastrado{players.length !== 1 ? "s" : ""}.
        </p>
      </div>
      <PlayerList initialPlayers={players} />
    </div>
  );
}
