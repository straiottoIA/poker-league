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
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href={`/seasons/${seasonId}`} className="hover:text-slate-900 transition-colors">
              {season.name}
            </Link>
            <span>/</span>
            <span className="font-medium text-slate-900">Elenco</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Gerenciar Elenco</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Selecione os jogadores inscritos nesta temporada.
          </p>
        </div>
        <Link
          href={`/seasons/${seasonId}`}
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          Voltar
        </Link>
      </div>
      {allPlayers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm text-slate-400">
            Nenhum jogador cadastrado.{" "}
            <Link href="/players" className="font-medium text-indigo-600 hover:underline">
              Adicione jogadores primeiro
            </Link>
            .
          </p>
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
