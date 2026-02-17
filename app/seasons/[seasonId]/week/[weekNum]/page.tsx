import { createClient } from "@/lib/supabase/server";
import { getSeason } from "@/lib/queries/seasons";
import { getSeasonPlayers } from "@/lib/queries/roster";
import { getWeekScores } from "@/lib/queries/scores";
import { AttendanceScoreForm } from "@/components/attendance-score-form";
import Link from "next/link";

export default async function WeekPage({
  params,
}: {
  params: Promise<{ seasonId: string; weekNum: string }>;
}) {
  const { seasonId, weekNum } = await params;
  const weekNumber = parseInt(weekNum, 10);
  const supabase = await createClient();

  const [season, players, existingScores] = await Promise.all([
    getSeason(supabase, seasonId),
    getSeasonPlayers(supabase, seasonId),
    getWeekScores(supabase, seasonId, weekNumber),
  ]);

  const existingMap = new Map(
    existingScores.map((s) => [s.player_id, s])
  );

  const initialScores = players.map((player) => {
    const existing = existingMap.get(player.id);
    return {
      player_id: player.id,
      player_name: player.name,
      attended: existing?.attended ?? true,
      points: existing?.points ?? 0,
    };
  });

  const prevWeek = weekNumber > 1 ? weekNumber - 1 : null;
  const nextWeek = weekNumber < season.num_weeks ? weekNumber + 1 : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {season.name} - Week {weekNumber}
          </h1>
          <p className="text-sm text-gray-500">
            Enter attendance and points for each player
          </p>
        </div>
        <Link
          href={`/seasons/${seasonId}`}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Dashboard
        </Link>
      </div>

      <AttendanceScoreForm
        seasonId={seasonId}
        weekNumber={weekNumber}
        initialScores={initialScores}
      />

      <div className="flex justify-between">
        {prevWeek ? (
          <Link
            href={`/seasons/${seasonId}/week/${prevWeek}`}
            className="text-sm text-blue-600 hover:underline"
          >
            &larr; Week {prevWeek}
          </Link>
        ) : (
          <div />
        )}
        {nextWeek ? (
          <Link
            href={`/seasons/${seasonId}/week/${nextWeek}`}
            className="text-sm text-blue-600 hover:underline"
          >
            Week {nextWeek} &rarr;
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
