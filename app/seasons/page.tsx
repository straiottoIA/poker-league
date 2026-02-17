import { createClient } from "@/lib/supabase/server";
import { getSeasons } from "@/lib/queries/seasons";
import Link from "next/link";
import { CreateSeasonForm } from "./create-season-form";

export default async function SeasonsPage() {
  const supabase = await createClient();
  const seasons = await getSeasons(supabase);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Seasons</h1>
      <CreateSeasonForm />
      {seasons.length === 0 ? (
        <p className="text-gray-500 text-sm">No seasons yet. Create one above.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
          {seasons.map((season) => (
            <li key={season.id} className="flex items-center justify-between px-4 py-3">
              <Link
                href={`/seasons/${season.id}`}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                {season.name}
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {season.num_weeks} weeks
                </span>
                {season.is_active && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Active
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
