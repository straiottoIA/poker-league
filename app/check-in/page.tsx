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
      <div className="space-y-10">
        <div className="border-b-2 border-ink pb-6">
          <p className="font-body text-[11px] font-bold uppercase tracking-[5px] text-crimson">Presença</p>
          <h1 className="mt-2 font-heading text-4xl font-bold text-ink">Check-in</h1>
        </div>
        <div className="border border-border-strong bg-surface px-8 py-12 text-center">
          <p className="font-body text-sm text-muted">Nenhuma temporada ativa. Crie uma temporada para começar.</p>
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
    <div className="space-y-10">
      <div className="border-b-2 border-ink pb-6">
        <p className="font-body text-[11px] font-bold uppercase tracking-[5px] text-crimson">Presença</p>
        <h1 className="mt-2 font-heading text-4xl font-bold text-ink">Check-in</h1>
        <p className="mt-2 font-body text-sm text-secondary">
          Temporada {season.name} · Semana {weekNumber}
        </p>
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
