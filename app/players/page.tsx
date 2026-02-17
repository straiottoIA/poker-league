import { createClient } from "@/lib/supabase/server";
import { getPlayers } from "@/lib/queries/players";
import { PlayerList } from "@/components/player-list";

export default async function PlayersPage() {
  const supabase = await createClient();
  const players = await getPlayers(supabase);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Players</h1>
      <PlayerList initialPlayers={players} />
    </div>
  );
}
