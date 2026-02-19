import { createClient } from "@/lib/supabase/server";
import { getSeasons } from "@/lib/queries/seasons";
import Link from "next/link";
import { CreateSeasonForm } from "./create-season-form";

export default async function SeasonsPage() {
  const supabase = await createClient();
  const seasons = await getSeasons(supabase);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Temporadas</h1>
        <p className="mt-1 text-sm text-slate-500">Gerencie as temporadas da liga.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Nova Temporada</h2>
        <CreateSeasonForm />
      </div>

      {seasons.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm text-slate-400">Nenhuma temporada criada ainda.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {seasons.map((season) => (
              <li
                key={season.id}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50"
              >
                <Link
                  href={`/seasons/${season.id}`}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  {season.name}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {season.num_weeks} semanas
                  </span>
                  {season.is_active && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      Ativa
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
