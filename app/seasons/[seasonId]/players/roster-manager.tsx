"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { enrollPlayer, unenrollPlayer } from "@/lib/queries/roster";
import { Player } from "@/lib/supabase/types";
import { useAuth } from "@/lib/supabase/use-auth";
import Link from "next/link";

export function RosterManager({
  seasonId,
  allPlayers,
  initialEnrolledIds,
}: {
  seasonId: string;
  allPlayers: Player[];
  initialEnrolledIds: string[];
}) {
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(
    new Set(initialEnrolledIds)
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { isLoggedIn } = useAuth();

  const handleToggle = async (playerId: string) => {
    setLoading(playerId);
    setError("");
    const supabase = createClient();
    const isEnrolled = enrolledIds.has(playerId);

    try {
      if (isEnrolled) {
        await unenrollPlayer(supabase, seasonId, playerId);
        setEnrolledIds((prev) => {
          const next = new Set(prev);
          next.delete(playerId);
          return next;
        });
      } else {
        await enrollPlayer(supabase, seasonId, playerId);
        setEnrolledIds((prev) => new Set(prev).add(playerId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar elenco. Tente novamente.");
    } finally {
      setLoading(null);
    }
  };

  const enrolledCount = enrolledIds.size;

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
      )}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {enrolledCount} de {allPlayers.length} jogador{allPlayers.length !== 1 ? "es" : ""} inscrito{enrolledCount !== 1 ? "s" : ""}.
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <ul className="divide-y divide-slate-100">
          {allPlayers.map((player) => {
            const isEnrolled = enrolledIds.has(player.id);
            const isLoading = loading === player.id;
            return (
              <li
                key={player.id}
                className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 ${
                  isEnrolled ? "bg-indigo-50/40" : ""
                }`}
              >
                <input
                  id={`roster-${player.id}`}
                  type="checkbox"
                  checked={isEnrolled}
                  onChange={() => handleToggle(player.id)}
                  disabled={!isLoggedIn || isLoading}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor={`roster-${player.id}`}
                  className={`flex-1 cursor-pointer text-sm font-medium ${
                    isEnrolled ? "text-slate-900" : "text-slate-600"
                  }`}
                >
                  {player.name}
                </label>
                {isLoading && (
                  <span className="text-xs text-slate-400">salvando...</span>
                )}
                {isEnrolled && !isLoading && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                    Inscrito
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {!isLoggedIn && (
        <p className="text-sm text-slate-500">
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">Faça login</Link> para gerenciar o elenco.
        </p>
      )}
    </div>
  );
}
