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
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            onClick={handleAdd}
            disabled={loading || !name.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">Faça login</Link> para gerenciar jogadores.
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
      )}

      {players.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
          <p className="text-sm text-slate-400">Nenhum jogador cadastrado ainda.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {players.map((player) => (
              <li
                key={player.id}
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-slate-50"
              >
                <span className="text-sm font-medium text-slate-900">
                  {player.name}
                </span>
                {isLoggedIn && (
                  <button
                    onClick={() => setPendingDeleteId(player.id)}
                    className="text-xs font-medium text-slate-400 transition-colors hover:text-red-500"
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
