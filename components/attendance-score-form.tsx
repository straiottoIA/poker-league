"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { upsertScores } from "@/lib/queries/scores";
import { createSeason } from "@/lib/queries/seasons";
import { fromRoman, toRoman } from "@/lib/utils/roman";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase/use-auth";
import Link from "next/link";

interface PlayerScore {
  player_id: string;
  player_name: string;
  attended: boolean;
  points: number;
}

export function AttendanceScoreForm({
  seasonId,
  weekNumber,
  numWeeks,
  seasonName,
  initialScores,
}: {
  seasonId: string;
  weekNumber: number;
  numWeeks: number;
  seasonName: string;
  initialScores: PlayerScore[];
}) {
  const [scores, setScores] = useState<PlayerScore[]>(initialScores);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  const updateScore = (index: number, field: keyof PlayerScore, value: unknown) => {
    setScores((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const supabase = createClient();
      await upsertScores(
        supabase,
        seasonId,
        weekNumber,
        scores.map((s) => ({
          player_id: s.player_id,
          points: s.points,
          attended: s.attended,
        }))
      );

      const isFinalTable = weekNumber === numWeeks + 1;
      if (isFinalTable) {
        const currentNum = fromRoman(seasonName);
        if (currentNum > 0) {
          const nextName = toRoman(currentNum + 1);
          const newSeason = await createSeason(supabase, nextName, numWeeks);
          setMessage(`Mesa Final salva! Temporada ${nextName} criada automaticamente.`);
          setTimeout(() => router.push(`/seasons/${newSeason.id}`), 2500);
          return;
        }
      }

      setMessage("Salvo com sucesso.");
      router.refresh();
    } catch (err) {
      setMessage(`Erro: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    } finally {
      setSaving(false);
    }
  };

  if (scores.length === 0) {
    return (
      <div className="border border-border-strong bg-surface px-8 py-12 text-center">
        <p className="font-body text-sm text-muted">Nenhum jogador inscrito nesta temporada.</p>
      </div>
    );
  }

  const isError = message.startsWith("Erro");

  return (
    <div className="space-y-5">
      <div className="overflow-hidden border border-border-strong bg-surface">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-border-strong bg-canvas">
              <th className="px-5 py-3 text-left font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
                Jogador
              </th>
              <th className="px-5 py-3 text-center font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
                Presente
              </th>
              <th className="px-5 py-3 text-center font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">
                Pontos
              </th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score, i) => (
              <tr
                key={score.player_id}
                className={`border-b border-border-subtle transition-colors hover:bg-canvas/40 ${
                  score.attended ? "bg-tint-crimson-row" : ""
                }`}
              >
                <td className="whitespace-nowrap px-5 py-3 font-body text-sm font-medium text-ink">
                  {score.player_name}
                </td>
                <td className="px-5 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={score.attended}
                    onChange={(e) => updateScore(i, "attended", e.target.checked)}
                    disabled={!isLoggedIn}
                    aria-label={`Presença de ${score.player_name}`}
                    className="h-4 w-4 border-border-strong text-crimson accent-crimson"
                  />
                </td>
                <td className="px-5 py-3 text-center">
                  <input
                    type="number"
                    value={score.points}
                    onChange={(e) =>
                      updateScore(i, "points", Number(e.target.value) || 0)
                    }
                    disabled={!isLoggedIn}
                    min={0}
                    max={9999}
                    aria-label={`Pontos de ${score.player_name}`}
                    className="w-20 border border-border-strong bg-surface px-2 py-1.5 text-center font-body text-sm text-ink focus:border-ink focus:outline-none disabled:bg-canvas disabled:text-muted"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isLoggedIn ? (
        <div className="flex items-center gap-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-crimson px-8 py-3 font-body text-[11px] font-bold uppercase tracking-[2px] text-white transition-colors hover:bg-[#c62828] disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar Pontuações"}
          </button>
          {message && (
            <span
              className={`font-body text-sm ${
                isError ? "text-crimson" : "text-secondary"
              }`}
            >
              {message}
            </span>
          )}
        </div>
      ) : (
        <p className="font-body text-sm text-secondary">
          <Link href="/login" className="font-bold text-ink underline hover:text-crimson">
            Faça login
          </Link>{" "}
          para editar pontuações.
        </p>
      )}
    </div>
  );
}
