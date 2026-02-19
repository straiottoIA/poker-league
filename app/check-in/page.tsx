import { createClient } from "@/lib/supabase/server";
import { getActiveSeason } from "@/lib/queries/seasons";
import { getSeasonPlayers } from "@/lib/queries/roster";
import { getCurrentWeek, getCheckedInPlayers } from "@/lib/queries/checkin";
import { CheckInForm } from "@/components/check-in-form";

export default async function CheckInPage() {
  const supabase = await createClient();
  const season = await getActiveSeason(supabase);

  if (!season) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Check-in</h1>
          <p className="mt-1 text-sm text-slate-500">Registre a presença dos jogadores.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm text-slate-400">Nenhuma temporada ativa. Crie uma temporada para começar.</p>
        </div>
      </div>
    );
  }

  const weekNumber = await getCurrentWeek(supabase, season.id, season.num_weeks);
  const [players, checkedIn] = await Promise.all([
    getSeasonPlayers(supabase, season.id),
    getCheckedInPlayers(supabase, season.id, weekNumber),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Check-in</h1>
        <p className="mt-1 text-sm text-slate-500">Registre a presença dos jogadores.</p>
      </div>
      <CheckInForm
        seasonId={season.id}
        seasonName={season.name}
        weekNumber={weekNumber}
        players={players}
        checkedInPlayerIds={checkedIn.map((p) => p.player_id)}
      />
    </div>
  );
}
