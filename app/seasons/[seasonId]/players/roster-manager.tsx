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
        <p className="border border-crimson/20 bg-tint-crimson px-4 py-2.5 font-body text-sm text-crimson">
          {error}
        </p>
      )}

      <p className="font-body text-[11px] font-bold uppercase tracking-[2px] text-muted">
        {enrolledCount} de {allPlayers.length} inscrito{enrolledCount !== 1 ? "s" : ""}
      </p>

      <div className="border border-border-strong bg-surface">
        <ul>
          {allPlayers.map((player, i) => {
            const isEnrolled = enrolledIds.has(player.id);
            const isLoading = loading === player.id;
            return (
              <li
                key={player.id}
                className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-canvas/60 ${
                  i < allPlayers.length - 1 ? "border-b border-border-subtle" : ""
                } ${isEnrolled ? "bg-tint-crimson-row" : ""}`}
              >
                <input
                  id={`roster-${player.id}`}
                  type="checkbox"
                  checked={isEnrolled}
                  onChange={() => handleToggle(player.id)}
                  disabled={!isLoggedIn || isLoading}
                  className="h-4 w-4 border-border-strong accent-crimson"
                />
                <label
                  htmlFor={`roster-${player.id}`}
                  className={`flex-1 cursor-pointer font-body text-sm font-medium ${
                    isEnrolled ? "text-ink" : "text-secondary"
                  }`}
                >
                  {player.name}
                </label>
                {isLoading && (
                  <span className="font-body text-[10px] text-muted">salvando...</span>
                )}
                {isEnrolled && !isLoading && (
                  <span className="bg-crimson px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-[2px] text-white">
                    Inscrito
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {!isLoggedIn && (
        <p className="font-body text-sm text-secondary">
          <Link href="/login" className="font-bold text-ink underline hover:text-crimson">
            Faça login
          </Link>{" "}
          para gerenciar o elenco.
        </p>
      )}
    </div>
  );
}
