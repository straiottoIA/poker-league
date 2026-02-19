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
    <div className="space-y-10">
      <div className="border-b-2 border-ink pb-6">
        <div className="flex items-center gap-2 font-body text-[11px] font-bold uppercase tracking-[2px] text-muted">
          <Link href={`/seasons/${seasonId}`} className="transition-colors hover:text-ink">
            {season.name}
          </Link>
          <span>/</span>
          <span className="text-ink">Elenco</span>
        </div>
        <h1 className="mt-3 font-heading text-4xl font-bold text-ink">Gerenciar Elenco</h1>
        <p className="mt-2 font-body text-sm text-secondary">
          Selecione os jogadores inscritos nesta temporada.
        </p>
      </div>

      {allPlayers.length === 0 ? (
        <div className="border border-border-strong bg-surface px-8 py-12 text-center">
          <p className="font-body text-sm text-muted">
            Nenhum jogador cadastrado.{" "}
            <Link href="/players" className="font-bold text-ink underline hover:text-crimson">
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
