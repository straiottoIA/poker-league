"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { upsertScores } from "@/lib/queries/scores";
import { useRouter } from "next/navigation";

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
      setMessage("Saved!");
      router.refresh();
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  if (scores.length === 0) {
    return <p className="text-gray-500 text-sm">No players enrolled in this season.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Player
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">
                Attended
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">
                Points
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {scores.map((score, i) => (
              <tr key={score.player_id}>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                  {score.player_name}
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={score.attended}
                    onChange={(e) => updateScore(i, "attended", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    value={score.points}
                    onChange={(e) =>
                      updateScore(i, "points", Number(e.target.value) || 0)
                    }
                    className="w-20 rounded border border-gray-300 px-2 py-1 text-center text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Scores"}
        </button>
        {message && (
          <span
            className={`text-sm ${
              message.startsWith("Error") ? "text-red-600" : "text-green-600"
            }`}
          >
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
