"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { checkInPlayer, uncheckInPlayer } from "@/lib/queries/checkin";
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

const ORDINAL = ["1º","2º","3º","4º","5º","6º","7º","8º","9º","10º","11º","12º","13º","14º","15º"];

export function CheckInForm({
  seasonId,
  seasonName,
  weekNumber,
  numWeeks,
  players,
  checkedInPlayerIds,
}: {
  seasonId: string;
  seasonName: string;
  weekNumber: number;
  numWeeks: number;
  players: Player[];
  checkedInPlayerIds: string[];
}) {
  const isFinalTable = weekNumber === numWeeks + 1;

  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set(checkedInPlayerIds));
  const [rankedPlayers, setRankedPlayers] = useState<string[]>(checkedInPlayerIds);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [savingScores, setSavingScores] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const dragItem = useRef<number | null>(null);
  const router = useRouter();
  const { isLoggedIn, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!saveSuccess) return;
    const t = setTimeout(() => setSaveSuccess(false), 3000);
    return () => clearTimeout(t);
  }, [saveSuccess]);

  const total = players.filter((p) => checkedIn.has(p.id)).length;

  const handleCheckIn = async (playerId: string) => {
    setLoadingId(playerId);
    setError("");
    try {
      const supabase = createClient();
      await checkInPlayer(supabase, seasonId, playerId, weekNumber);
      setCheckedIn((prev) => new Set(prev).add(playerId));
      setRankedPlayers((prev) => [...prev, playerId]);
      setSaveSuccess(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer check-in. Tente novamente.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleUncheckIn = async (playerId: string) => {
    setLoadingId(playerId);
    setError("");
    try {
      const supabase = createClient();
      await uncheckInPlayer(supabase, seasonId, playerId, weekNumber);
      setCheckedIn((prev) => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
      setRankedPlayers((prev) => prev.filter((id) => id !== playerId));
      setSaveSuccess(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao desfazer check-in. Tente novamente.");
    } finally {
      setLoadingId(null);
    }
  };

  // ── Drag-and-drop handlers (desktop) ──────────────────────────
  const handleDragStart = (index: number) => { dragItem.current = index; };
  const handleDragEnter = (index: number) => { setDragOverIndex(index); };
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverIndex !== null && dragItem.current !== dragOverIndex) {
      setRankedPlayers((prev) => {
        const next = [...prev];
        const [removed] = next.splice(dragItem.current!, 1);
        next.splice(dragOverIndex, 0, removed);
        return next;
      });
    }
    dragItem.current = null;
    setDragOverIndex(null);
  };

  // ── Arrow buttons (mobile) ─────────────────────────────────────
  const moveUp = (index: number) => {
    if (index === 0) return;
    setRankedPlayers((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };
  const moveDown = (index: number) => {
    if (index === rankedPlayers.length - 1) return;
    setRankedPlayers((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleSaveScores = async () => {
    if (total === 0) return;
    setSavingScores(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const supabase = createClient();
      const scores = players.map((p) => {
        const isPresent = checkedIn.has(p.id);
        const rankIndex = rankedPlayers.indexOf(p.id);
        return {
          player_id: p.id,
          points: isPresent && rankIndex !== -1 ? calculatePoints(rankIndex + 1, total) : 0,
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

  const checkedCount = total;
  const totalSessions = numWeeks + 1;
  const progressPct = Math.round((weekNumber / totalSessions) * 100);

  const searchResults = searchTerm.trim().length >= 1
    ? players.filter(
        (p) =>
          !checkedIn.has(p.id) &&
          p.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
    : [];

  return (
    <div className="space-y-8">
      {/* ── PROGRESS BAR ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
          <span>
            {isFinalTable ? "Mesa Final" : `Semana ${weekNumber} de ${numWeeks}`}
          </span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1 w-full overflow-hidden bg-border-strong">
          <div
            className="h-1 bg-crimson transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar seu nome para fazer check-in..."
          autoComplete="off"
          className="w-full border border-border-strong bg-surface px-4 py-3 font-body text-sm text-ink placeholder:text-muted focus:border-crimson focus:outline-none focus:ring-2 focus:ring-crimson/20"
        />
        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 border border-t-0 border-border-strong bg-surface shadow-[var(--shadow-md)]">
            {searchResults.map((player) => (
              <button
                key={player.id}
                onClick={() => {
                  handleCheckIn(player.id);
                  setSearchTerm("");
                }}
                disabled={loadingId === player.id}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-canvas disabled:opacity-50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel">
                  <span className="font-heading text-xs font-bold text-white">
                    {getInitials(player.name)}
                  </span>
                </div>
                <span className="font-body text-sm font-medium text-ink">{player.name}</span>
                <span className="ml-auto font-body text-[10px] font-bold uppercase tracking-[2px] text-crimson">
                  {loadingId === player.id ? "..." : "Check-in →"}
                </span>
              </button>
            ))}
          </div>
        )}
        {searchTerm.trim().length >= 1 && searchResults.length === 0 && (
          <div className="absolute left-0 right-0 top-full z-20 border border-t-0 border-border-strong bg-surface px-4 py-3 shadow-[var(--shadow-md)]">
            <p className="font-body text-sm text-muted">Nenhum jogador encontrado.</p>
          </div>
        )}
      </div>

      {/* ── SECTION 1: Check-in ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-body text-sm text-secondary">
            {seasonName} — {isFinalTable ? "Mesa Final" : `Semana ${weekNumber}`}
          </p>
          <span className="border border-border-strong px-3 py-1 font-body text-[10px] font-bold uppercase tracking-[2px] text-secondary">
            {checkedCount}/{players.length} presentes
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {players.map((player) => {
            const isCheckedIn = checkedIn.has(player.id);
            const isLoading = loadingId === player.id;
            return (
              <div
                key={player.id}
                className={`flex flex-col items-center gap-3 rounded-xl border p-4 text-center transition-colors ${
                  isCheckedIn
                    ? "border-crimson/30 bg-tint-crimson"
                    : "border-border-subtle bg-surface hover:border-crimson/20"
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isCheckedIn ? "bg-crimson" : "bg-panel"}`}>
                  <span className="font-heading text-sm font-bold text-white">
                    {getInitials(player.name)}
                  </span>
                </div>
                <p className="font-heading text-sm font-bold leading-tight text-ink">
                  {player.name}
                </p>
                {isCheckedIn ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-body text-[10px] font-bold uppercase tracking-[2px] text-crimson">
                      ✓ Presente
                    </span>
                    {!authLoading && isLoggedIn && (
                      <button
                        onClick={() => handleUncheckIn(player.id)}
                        disabled={isLoading}
                        className="font-body text-[9px] font-bold uppercase tracking-[1px] text-muted transition-colors hover:text-crimson disabled:opacity-50"
                      >
                        {isLoading ? "..." : "desfazer"}
                      </button>
                    )}
                  </div>
                ) : !authLoading && isLoggedIn ? (
                  <button
                    onClick={() => handleCheckIn(player.id)}
                    disabled={isLoading}
                    className="rounded-md bg-ink px-3 py-1.5 font-body text-[10px] font-bold uppercase tracking-[2px] text-canvas transition-all duration-150 hover:-translate-y-0.5 hover:bg-crimson disabled:opacity-50"
                  >
                    {isLoading ? "..." : "Check-in"}
                  </button>
                ) : (
                  <span className="font-body text-[10px] font-bold uppercase tracking-[1px] text-muted">
                    {isCheckedIn ? "Presente" : "Ausente"}
                  </span>
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

      {/* ── SECTION 2: Colocações (drag-and-drop + botões) ── */}
      {!authLoading && isLoggedIn && checkedIn.size >= 1 && (
        <div className="space-y-4 border-t border-border-subtle pt-8">
          <div className="flex items-center gap-3">
            <span className="font-body text-[10px] font-bold text-crimson" aria-hidden="true">♠</span>
            <h2 className="font-heading text-xl font-bold text-ink">
              Colocações — {isFinalTable ? "Mesa Final" : `Semana ${weekNumber}`}
            </h2>
          </div>
          <p className="font-body text-sm text-secondary">
            Arraste ou use as setas para ordenar a classificação final.
          </p>

          <div className="space-y-2">
            {rankedPlayers.map((playerId, index) => {
              const player = players.find((p) => p.id === playerId);
              if (!player) return null;
              const isDragOver = dragOverIndex === index;
              return (
                <div
                  key={playerId}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className={`flex cursor-grab items-center gap-3 rounded-lg border px-4 py-3 transition-all active:cursor-grabbing active:opacity-60 ${
                    isDragOver
                      ? "border-crimson bg-tint-crimson scale-[1.01]"
                      : "border-border-subtle bg-surface hover:border-crimson/30"
                  }`}
                >
                  {/* Posição */}
                  <span className={`w-7 shrink-0 font-heading text-base font-bold ${index < 3 ? "text-crimson" : "text-muted"}`}>
                    {ORDINAL[index] ?? `${index + 1}º`}
                  </span>

                  {/* Avatar */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-crimson">
                    <span className="font-heading text-xs font-bold text-white">
                      {getInitials(player.name)}
                    </span>
                  </div>

                  {/* Nome */}
                  <p className="flex-1 font-body text-sm font-medium text-ink">{player.name}</p>

                  {/* Botões ▲▼ (mobile) */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      aria-label="Mover para cima"
                      className="flex h-6 w-6 items-center justify-center text-muted transition-colors hover:text-crimson disabled:opacity-20"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === rankedPlayers.length - 1}
                      aria-label="Mover para baixo"
                      className="flex h-6 w-6 items-center justify-center text-muted transition-colors hover:text-crimson disabled:opacity-20"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  {/* Drag handle */}
                  <svg className="h-4 w-4 shrink-0 text-muted/50" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                  </svg>
                </div>
              );
            })}
          </div>

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
            disabled={total === 0 || savingScores}
            className="rounded-md bg-crimson px-8 py-3 font-body text-[11px] font-bold uppercase tracking-[2px] text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#c62828] hover:shadow-[var(--shadow-md)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {savingScores ? "Salvando..." : "Salvar Pontuação"}
          </button>
        </div>
      )}
    </div>
  );
}
