import { createClient } from "@/lib/supabase/server";
import { getSeasons } from "@/lib/queries/seasons";
import Link from "next/link";
import { CreateSeasonForm } from "./create-season-form";

export default async function SeasonsPage() {
  const supabase = await createClient();
  const seasons = await getSeasons(supabase);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b-2 border-ink pb-6">
        <p className="font-body text-[11px] font-bold uppercase tracking-[5px] text-crimson">Liga</p>
        <h1 className="mt-2 font-heading text-4xl font-bold text-ink">Temporadas</h1>
      </div>

      {/* Create season */}
      <div>
        <p className="mb-4 font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
          Nova Temporada
        </p>
        <CreateSeasonForm />
      </div>

      {/* Season list */}
      <div>
        <p className="mb-4 font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
          {seasons.length > 0 ? `${seasons.length} temporada${seasons.length !== 1 ? "s" : ""}` : "Histórico"}
        </p>
        {seasons.length === 0 ? (
          <div className="border border-[rgba(26,26,26,0.15)] bg-white px-8 py-12 text-center">
            <p className="font-body text-sm text-muted">Nenhuma temporada criada ainda.</p>
          </div>
        ) : (
          <div className="border border-[rgba(26,26,26,0.15)] bg-white">
            <ul>
              {seasons.map((season, i) => (
                <li
                  key={season.id}
                  className={`flex items-center justify-between px-5 py-4 transition-colors hover:bg-canvas/60 ${
                    i < seasons.length - 1 ? "border-b border-[rgba(26,26,26,0.08)]" : ""
                  }`}
                >
                  <Link
                    href={`/seasons/${season.id}`}
                    className="font-body text-sm font-semibold text-ink underline-offset-2 hover:text-crimson hover:underline"
                  >
                    {season.name}
                  </Link>
                  <div className="flex items-center gap-4">
                    <span className="font-body text-[11px] text-muted">
                      {season.num_weeks} semanas
                    </span>
                    {season.is_active && (
                      <span className="bg-crimson px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-[2px] text-white">
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
    </div>
  );
}
