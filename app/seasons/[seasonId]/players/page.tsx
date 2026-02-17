import { createClient } from "@/lib/supabase/server";
import { getSeason } from "@/lib/queries/seasons";
import { getPlayers } from "@/lib/queries/players";
import { getEnrolledPlayerIds } from "@/lib/queries/roster";
import { RosterManager } from "./roster-manager";
import Link from "next/link";

export default async function SeasonPlayersPage({
  params,
}: {
  params: Promise<{ seasonId: string }>;
}) {
  const { seasonId } = await params;
  const supabase = await createClient();

  const [season, allPlayers, enrolledIds] = await Promise.all([
    getSeason(supabase, seasonId),
    getPlayers(supabase),
    getEnrolledPlayerIds(supabase, seasonId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{season.name} - Roster</h1>
          <p className="text-sm text-gray-500">
            Check players to enroll them in this season
          </p>
        </div>
        <Link
          href={`/seasons/${seasonId}`}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Dashboard
        </Link>
      </div>
      {allPlayers.length === 0 ? (
        <div className="text-sm text-gray-500">
          No players exist yet.{" "}
          <Link href="/players" className="text-blue-600 hover:underline">
            Add players first
          </Link>
          .
        </div>
      ) : (
        <RosterManager
          seasonId={seasonId}
          allPlayers={allPlayers}
          initialEnrolledIds={enrolledIds}
        />
      )}
    </div>
  );
}
