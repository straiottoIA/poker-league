import { createClient } from "@/lib/supabase/server";
import { getSeason } from "@/lib/queries/seasons";
import { getSeasonPlayers } from "@/lib/queries/roster";
import { getLeaderboard, getAllSeasonScores } from "@/lib/queries/scores";
import { Leaderboard } from "@/components/leaderboard";
import { SeasonGrid } from "@/components/season-grid";
import Link from "next/link";

export default async function SeasonDashboard({
  params,
}: {
  params: Promise<{ seasonId: string }>;
}) {
  const { seasonId } = await params;
  const supabase = await createClient();

  const [season, players, leaderboard, scores] = await Promise.all([
    getSeason(supabase, seasonId),
    getSeasonPlayers(supabase, seasonId),
    getLeaderboard(supabase, seasonId),
    getAllSeasonScores(supabase, seasonId),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{season.name}</h1>
          <p className="text-sm text-gray-500">{season.num_weeks} weeks</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/seasons/${seasonId}/players`}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Manage Roster
          </Link>
          <Link
            href={`/seasons/${seasonId}/week/1`}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Enter Scores
          </Link>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Leaderboard</h2>
        <Leaderboard entries={leaderboard} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Season Grid</h2>
        <SeasonGrid
          seasonId={seasonId}
          players={players}
          scores={scores}
          numWeeks={season.num_weeks}
        />
      </section>
    </div>
  );
}
