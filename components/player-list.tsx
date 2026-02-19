"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createPlayer, deletePlayer } from "@/lib/queries/players";
import { useRouter } from "next/navigation";
import { Player } from "@/lib/supabase/types";
import { useAuth } from "@/lib/supabase/use-auth";
import { ConfirmDialog } from "@/components/confirm-dialog";
import Link from "next/link";

export function PlayerList({ initialPlayers }: { initialPlayers: Player[] }) {
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
      setPlayers((prev) => [...prev, player].sort((a, b) => a.name.localeCompare(b.name)));
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
    <div className="space-y-4">
      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Deletar jogador"
        message={`Tem certeza que deseja deletar "${pendingPlayerName}"? Isso vai removê-lo de todas as temporadas.`}
        confirmLabel="Deletar"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setPendingDeleteId(null)}
      />

      {isLoggedIn ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Nome do jogador"
            className="flex-1 border border-[rgba(26,26,26,0.2)] bg-white px-3 py-2.5 font-body text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
          />
          <button
            onClick={handleAdd}
            disabled={loading || !name.trim()}
            className="bg-ink px-6 py-2.5 font-body text-[11px] font-bold uppercase tracking-[2px] text-canvas transition-colors hover:bg-crimson disabled:opacity-50"
          >
            {loading ? "..." : "Adicionar"}
          </button>
        </div>
      ) : (
        <p className="font-body text-sm text-secondary">
          <Link href="/login" className="font-bold text-ink underline hover:text-crimson">
            Faça login
          </Link>{" "}
          para gerenciar jogadores.
        </p>
      )}

      {error && (
        <p className="border border-crimson/20 bg-[rgba(229,57,53,0.05)] px-4 py-2.5 font-body text-sm text-crimson">
          {error}
        </p>
      )}

      {players.length === 0 ? (
        <div className="border border-[rgba(26,26,26,0.15)] bg-white px-8 py-12 text-center">
          <p className="font-body text-sm text-muted">Nenhum jogador cadastrado ainda.</p>
        </div>
      ) : (
        <div className="border border-[rgba(26,26,26,0.15)] bg-white">
          <ul>
            {players.map((player, i) => (
              <li
                key={player.id}
                className={`flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-canvas/60 ${
                  i < players.length - 1 ? "border-b border-[rgba(26,26,26,0.08)]" : ""
                }`}
              >
                <span className="font-body text-sm font-medium text-ink">
                  {player.name}
                </span>
                {isLoggedIn && (
                  <button
                    onClick={() => setPendingDeleteId(player.id)}
                    className="font-body text-[10px] font-bold uppercase tracking-[2px] text-muted transition-colors hover:text-crimson"
                  >
                    Remover
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
