"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createPlayer, deletePlayer } from "@/lib/queries/players";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/use-auth";
import { ConfirmDialog } from "@/components/confirm-dialog";

export interface PlayerWithStats {
  id: string;
  name: string;
  total_points: number | null;
  season_wins: number | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PlayerGrid({ initialPlayers }: { initialPlayers: PlayerWithStats[] }) {
  const [players, setPlayers] = useState(initialPlayers);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const handleAdd = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const player = await createPlayer(supabase, name.trim());
      setPlayers((prev) =>
        [...prev, { ...player, total_points: null, season_wins: null }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar jogador.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setError("");
    try {
      const supabase = createClient();
      await deletePlayer(supabase, id);
      setPlayers((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar jogador.");
    }
  };

  const pendingPlayerName = players.find((p) => p.id === pendingDeleteId)?.name ?? "";

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Remover jogador"
        message={`Tem certeza que deseja remover "${pendingPlayerName}"? Isso vai removê-lo de todas as temporadas.`}
        confirmLabel="Remover"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setPendingDeleteId(null)}
      />

      {isLoggedIn && (
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Nome do jogador"
            className="flex-1 rounded-md border border-border-strong bg-surface px-3 py-2.5 font-body text-sm text-ink placeholder:text-muted focus:border-crimson focus:outline-none focus:ring-2 focus:ring-crimson/20"
          />
          <button
            onClick={handleAdd}
            disabled={loading || !name.trim()}
            className="rounded-md bg-ink px-6 py-2.5 font-body text-[11px] font-bold uppercase tracking-[2px] text-canvas shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-crimson hover:shadow-[var(--shadow-md)] disabled:opacity-50"
          >
            {loading ? "..." : "Adicionar"}
          </button>
        </div>
      )}

      {error && (
        <p className="border border-crimson/20 bg-tint-crimson px-4 py-2.5 font-body text-sm text-crimson">
          {error}
        </p>
      )}

      {players.length === 0 ? (
        <div className="border border-border-strong bg-surface px-8 py-12 text-center">
          <p className="font-body text-sm text-muted">Nenhum jogador cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="relative flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5 shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-1 hover:border-crimson/30 hover:shadow-[var(--shadow-md)]"
            >
              {isLoggedIn && (
                <button
                  onClick={() => setPendingDeleteId(player.id)}
                  className="absolute right-3 top-3 font-body text-[10px] font-bold text-muted transition-colors hover:text-crimson"
                  aria-label={`Remover ${player.name}`}
                >
                  ×
                </button>
              )}

              {/* Avatar + Name */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-panel">
                  <span className="font-heading text-sm font-bold text-white">
                    {getInitials(player.name)}
                  </span>
                </div>
                <p className="font-heading text-sm font-bold leading-tight text-ink">
                  {player.name}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 border-t border-border-subtle pt-4">
                <div>
                  <p className="font-heading text-xl font-bold text-crimson">
                    {player.total_points ?? "—"}
                  </p>
                  <p className="mt-0.5 font-body text-[9px] font-bold uppercase tracking-[2px] text-muted">
                    Pontos
                  </p>
                </div>
                <div>
                  <p className="font-heading text-xl font-bold text-crimson">
                    {player.season_wins ?? "—"}
                  </p>
                  <p className="mt-0.5 font-body text-[9px] font-bold uppercase tracking-[2px] text-muted">
                    Vit. Temp.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
