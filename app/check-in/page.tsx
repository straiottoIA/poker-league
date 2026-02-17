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
        <h1 className="text-2xl font-bold">Check-in</h1>
        <p className="text-gray-500 text-sm">No active season. Create a season to get started.</p>
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
      <h1 className="text-2xl font-bold">Check-in</h1>
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
