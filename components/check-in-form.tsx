"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { checkInPlayer } from "@/lib/queries/checkin";
import { upsertScores } from "@/lib/queries/scores";
import { calculatePoints } from "@/lib/utils/points";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/use-auth";
import Link from "next/link";

interface Player {
  id: string;
  name: string;
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

export function CheckInForm({
  seasonId,
  seasonName,
  weekNumber,
  players,
  checkedInPlayerIds,
}: {
  seasonId: string;
  seasonName: string;
  weekNumber: number;
  players: Player[];
  checkedInPlayerIds: string[];
}) {
  const [checkedIn, setCheckedIn] = useState<Set<string>>(
    new Set(checkedInPlayerIds)
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [placements, setPlacements] = useState<Map<string, number>>(new Map());
  const [savingScores, setSavingScores] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const router = useRouter();
  const { isLoggedIn, loading: authLoading } = useAuth();

  const handleCheckIn = async (playerId: string) => {
    setLoading(playerId);
    setError("");
    try {
      const supabase = createClient();
      await checkInPlayer(supabase, seasonId, playerId, weekNumber);
      setCheckedIn((prev) => new Set(prev).add(playerId));
      setSaveSuccess(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer check-in. Tente novamente.");
    } finally {
      setLoading(null);
    }
  };

  const checkedInPlayers = players.filter((p) => checkedIn.has(p.id));
  const total = checkedInPlayers.length;

  const filledPositions = checkedInPlayers.map((p) => placements.get(p.id));
  const allFilled = filledPositions.every((v) => v !== undefined && v >= 1 && v <= total);
  const positionValues = filledPositions.filter((v): v is number => v !== undefined);
  const hasDuplicates = new Set(positionValues).size !== positionValues.length;
  const isPlacementsValid = allFilled && !hasDuplicates && total > 0;

  const duplicatePositions = new Set<number>();
  if (hasDuplicates) {
    const seen = new Map<number, number>();
    for (const v of positionValues) {
      seen.set(v, (seen.get(v) ?? 0) + 1);
    }
    for (const [k, count] of seen) {
      if (count > 1) duplicatePositions.add(k);
    }
  }

  const handleSaveScores = async () => {
    if (!isPlacementsValid) return;
    setSavingScores(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const supabase = createClient();
      const scores = players.map((p) => {
        const isPresent = checkedIn.has(p.id);
        const position = placements.get(p.id);
        return {
          player_id: p.id,
          points: isPresent && position !== undefined ? calculatePoints(position, total) : 0,
          attended: isPresent,
        };
      });
      await upsertScores(supabase, seasonId, weekNumber, scores);
      setSaveSuccess(true);
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar pontuação.");
    } finally {
      setSavingScores(false);
    }
  };

  if (players.length === 0) {
    return (
      <div className="border border-border-strong bg-surface px-8 py-12 text-center">
        <p className="font-body text-sm text-muted">Nenhum jogador inscrito nesta temporada.</p>
      </div>
    );
  }

  const checkedCount = checkedIn.size;

  return (
    <div className="space-y-8">
      {/* ── SECTION 1: Check-in ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-body text-sm text-secondary">
            {seasonName} — Semana {weekNumber}
          </p>
          <span className="border border-border-strong px-3 py-1 font-body text-[10px] font-bold uppercase tracking-[2px] text-secondary">
            {checkedCount}/{players.length} presentes
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {players.map((player) => {
            const isCheckedIn = checkedIn.has(player.id);
            const isLoading = loading === player.id;
            return (
              <div
                key={player.id}
                className={`flex flex-col items-center gap-3 rounded-xl border p-4 text-center transition-colors ${
                  isCheckedIn
                    ? "border-crimson/30 bg-tint-crimson"
                    : "border-border-subtle bg-surface hover:border-crimson/20"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    isCheckedIn ? "bg-crimson" : "bg-panel"
                  }`}
                >
                  <span className="font-heading text-sm font-bold text-white">
                    {getInitials(player.name)}
                  </span>
                </div>
                <p className="font-heading text-sm font-bold leading-tight text-ink">
                  {player.name}
                </p>
                {isCheckedIn ? (
                  <span className="font-body text-[10px] font-bold uppercase tracking-[2px] text-crimson">
                    ✓ Presente
                  </span>
                ) : !authLoading && isLoggedIn ? (
                  <button
                    onClick={() => handleCheckIn(player.id)}
                    disabled={isLoading}
                    className="rounded-md bg-ink px-3 py-1.5 font-body text-[10px] font-bold uppercase tracking-[2px] text-canvas transition-all duration-150 hover:-translate-y-0.5 hover:bg-crimson disabled:opacity-50"
                  >
                    {isLoading ? "..." : "Check-in"}
                  </button>
                ) : (
                  <span className="font-body text-xs text-muted">–</span>
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <p className="border border-crimson/20 bg-tint-crimson px-4 py-2.5 font-body text-sm text-crimson">
            {error}
          </p>
        )}
        {!authLoading && !isLoggedIn && (
          <p className="font-body text-sm text-secondary">
            <Link href="/login" className="font-bold text-ink underline hover:text-crimson">Faça login</Link>{" "}
            para registrar presenças.
          </p>
        )}
      </div>

      {/* ── SECTION 2: Colocações ── */}
      {!authLoading && isLoggedIn && checkedIn.size >= 1 && (
        <div className="space-y-4 border-t border-border-subtle pt-8">
          <div className="flex items-center gap-3">
            <span className="font-body text-[10px] font-bold text-crimson" aria-hidden="true">♠</span>
            <h2 className="font-heading text-xl font-bold text-ink">
              Colocações — Semana {weekNumber}
            </h2>
          </div>
          <p className="font-body text-sm text-secondary">
            Preencha a posição final de cada jogador ao encerrar a etapa.
          </p>

          <div className="space-y-2">
            {checkedInPlayers.map((player) => {
              const pos = placements.get(player.id);
              const isDuplicate = pos !== undefined && duplicatePositions.has(pos);
              return (
                <div
                  key={player.id}
                  className="flex items-center gap-4 rounded-lg border border-border-subtle bg-surface px-4 py-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-crimson">
                    <span className="font-heading text-xs font-bold text-white">
                      {getInitials(player.name)}
                    </span>
                  </div>
                  <p className="flex-1 font-body text-sm font-medium text-ink">
                    {player.name}
                  </p>
                  <input
                    type="number"
                    min={1}
                    max={total}
                    value={pos ?? ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setPlacements((prev) => {
                        const next = new Map(prev);
                        if (isNaN(val) || e.target.value === "") {
                          next.delete(player.id);
                        } else {
                          next.set(player.id, Math.min(Math.max(val, 1), total));
                        }
                        return next;
                      });
                    }}
                    placeholder="–"
                    className={`w-16 rounded-md border px-2 py-1.5 text-center font-body text-sm font-bold text-ink focus:outline-none focus:ring-2 ${
                      isDuplicate
                        ? "border-crimson bg-tint-crimson text-crimson focus:ring-crimson/20"
                        : "border-border-strong bg-canvas focus:border-crimson focus:ring-crimson/20"
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {hasDuplicates && (
            <p className="font-body text-sm text-crimson">
              Posições duplicadas — cada jogador deve ter uma posição única.
            </p>
          )}

          {saveError && (
            <p className="border border-crimson/20 bg-tint-crimson px-4 py-2.5 font-body text-sm text-crimson">
              {saveError}
            </p>
          )}

          {saveSuccess && (
            <p className="border border-green-500/20 bg-green-500/5 px-4 py-2.5 font-body text-sm text-green-600 dark:text-green-400">
              ✓ Pontuação salva com sucesso!
            </p>
          )}

          <button
            onClick={handleSaveScores}
            disabled={!isPlacementsValid || savingScores}
            className="rounded-md bg-crimson px-8 py-3 font-body text-[11px] font-bold uppercase tracking-[2px] text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#c62828] hover:shadow-[var(--shadow-md)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {savingScores ? "Salvando..." : "Salvar Pontuação"}
          </button>
        </div>
      )}
    </div>
  );
}
