"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { upsertScores } from "@/lib/queries/scores";
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
  initialScores,
}: {
  seasonId: string;
  weekNumber: number;
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
      setMessage("Salvo com sucesso!");
      router.refresh();
    } catch (err) {
      setMessage(`Erro: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    } finally {
      setSaving(false);
    }
  };

  if (scores.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
        <p className="text-sm text-slate-400">Nenhum jogador inscrito nesta temporada.</p>
      </div>
    );
  }

  const isError = message.startsWith("Erro");

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Jogador
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                Presente
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                Pontos
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {scores.map((score, i) => (
              <tr
                key={score.player_id}
                className={`transition-colors hover:bg-slate-50 ${
                  score.attended ? "bg-emerald-50/40" : ""
                }`}
              >
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                  {score.player_name}
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={score.attended}
                    onChange={(e) => updateScore(i, "attended", e.target.checked)}
                    disabled={!isLoggedIn}
                    aria-label={`Presença de ${score.player_name}`}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-4 py-3 text-center">
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
                    className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isLoggedIn ? (
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar Pontuações"}
          </button>
          {message && (
            <span
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                isError
                  ? "bg-red-50 text-red-600 border border-red-100"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-100"
              }`}
            >
              {message}
            </span>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">Faça login</Link> para editar pontuações.
        </p>
      )}
    </div>
  );
}
