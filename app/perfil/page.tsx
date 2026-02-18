"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Season } from "@/lib/supabase/types";

type Tab = "resumo" | "estatisticas" | "presencas";

interface StatsData {
  totalSeasons: number;
  totalPlayers: number;
  activeSeason: Season | null;
  totalWeeksPlayed: number;
  totalAttendances: number;
  avgAttendancePerWeek: number;
}

interface WeekAttendance {
  weekNumber: number;
  count: number;
}

interface SeasonAttendance {
  season: Season;
  weeks: WeekAttendance[];
  total: number;
}

export default function PerfilPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("resumo");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [attendance, setAttendance] = useState<SeasonAttendance[] | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
      } else {
        setUser(user);
        setLoading(false);
      }
    });
  }, [router]);

  const loadStats = useCallback(async () => {
    setDataLoading(true);
    const supabase = createClient();

    const [seasonsRes, playersRes, scoresRes] = await Promise.all([
      supabase.from("seasons").select("*"),
      supabase.from("players").select("id"),
      supabase.from("scores").select("season_id, week_number, attended").limit(5000),
    ]);

    const seasons = (seasonsRes.data ?? []) as Season[];
    const scores = scoresRes.data ?? [];
    const activeSeason = seasons.find((s) => s.is_active) ?? null;

    const uniqueWeeks = new Set(
      scores.map((s: { season_id: string; week_number: number }) => `${s.season_id}-${s.week_number}`)
    );
    const totalAttendances = scores.filter((s: { attended: boolean }) => s.attended).length;
    const totalWeeksPlayed = uniqueWeeks.size;

    setStats({
      totalSeasons: seasons.length,
      totalPlayers: (playersRes.data ?? []).length,
      activeSeason,
      totalWeeksPlayed,
      totalAttendances,
      avgAttendancePerWeek:
        totalWeeksPlayed > 0 ? Math.round(totalAttendances / totalWeeksPlayed) : 0,
    });
    setDataLoading(false);
  }, []);

  const loadAttendance = useCallback(async () => {
    setDataLoading(true);
    const supabase = createClient();

    const { data: seasons } = await supabase
      .from("seasons")
      .select("*")
      .order("created_at", { ascending: false });

    if (!seasons) {
      setDataLoading(false);
      return;
    }

    const result: SeasonAttendance[] = await Promise.all(
      (seasons as Season[]).map(async (season) => {
        const { data: scores } = await supabase
          .from("scores")
          .select("week_number")
          .eq("season_id", season.id)
          .eq("attended", true)
          .limit(1000);

        const weekMap = new Map<number, number>();
        for (const score of scores ?? []) {
          const w = score.week_number as number;
          weekMap.set(w, (weekMap.get(w) ?? 0) + 1);
        }

        const weeks = Array.from(weekMap.entries())
          .map(([weekNumber, count]) => ({ weekNumber, count }))
          .sort((a, b) => a.weekNumber - b.weekNumber);

        return {
          season,
          weeks,
          total: weeks.reduce((acc, w) => acc + w.count, 0),
        };
      })
    );

    setAttendance(result);
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (activeTab === "estatisticas" && !stats) loadStats();
    if (activeTab === "presencas" && !attendance) loadAttendance();
  }, [activeTab, user, stats, attendance, loadStats, loadAttendance]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.email?.charAt(0).toUpperCase() ?? "?";
  const memberSince = new Date(user.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const lastLogin = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const tabs: { id: Tab; label: string }[] = [
    { id: "resumo", label: "Resumo" },
    { id: "estatisticas", label: "Estatísticas" },
    { id: "presencas", label: "Presenças" },
  ];

  return (
    <div className="mx-auto max-w-2xl py-10 px-4">
      {/* Header do perfil */}
      <div className="mb-8 flex items-center gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
          {initials}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{user.email}</h1>
          <p className="text-sm text-gray-500">Administrador</p>
        </div>
      </div>

      {/* Abas */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── RESUMO ── */}
      {activeTab === "resumo" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="space-y-5">
            <InfoRow label="E-mail" value={user.email ?? "—"} />
            <InfoRow label="Função" value="Administrador" />
            <InfoRow label="Membro desde" value={memberSince} />
            <InfoRow label="Último acesso" value={lastLogin} />
          </div>
          <div className="mt-8">
            <button
              onClick={handleLogout}
              className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
            >
              Sair da conta
            </button>
          </div>
        </div>
      )}

      {/* ── ESTATÍSTICAS ── */}
      {activeTab === "estatisticas" && (
        <>
          {dataLoading && <LoadingState />}
          {!dataLoading && stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Temporadas" value={stats.totalSeasons} />
                <StatCard label="Jogadores" value={stats.totalPlayers} />
                <StatCard label="Semanas Registradas" value={stats.totalWeeksPlayed} />
                <StatCard label="Total de Presenças" value={stats.totalAttendances} />
                <div className="col-span-2">
                  <StatCard
                    label="Média de Presenças / Semana"
                    value={stats.avgAttendancePerWeek}
                    suffix="jogadores"
                  />
                </div>
              </div>

              {stats.activeSeason ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-green-600">
                    Temporada Ativa
                  </p>
                  <p className="mt-1 text-lg font-bold text-green-800">
                    {stats.activeSeason.name}
                  </p>
                  <p className="text-sm text-green-600">
                    {stats.activeSeason.num_weeks} semanas no total
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
                  <p className="text-sm text-yellow-700">Nenhuma temporada ativa no momento.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── PRESENÇAS ── */}
      {activeTab === "presencas" && (
        <>
          {dataLoading && <LoadingState />}
          {!dataLoading && attendance && attendance.length === 0 && (
            <p className="text-center text-gray-400 py-12">Nenhum dado de presença encontrado.</p>
          )}
          {!dataLoading && attendance && attendance.length > 0 && (
            <div className="space-y-5">
              {attendance.map(({ season, weeks, total }) => (
                <div
                  key={season.id}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{season.name}</h3>
                    <div className="flex items-center gap-2">
                      {season.is_active && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Ativa
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {total} presenças
                      </span>
                    </div>
                  </div>

                  {weeks.length === 0 ? (
                    <p className="text-sm text-gray-400">Sem presenças registradas.</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {weeks.map(({ weekNumber, count }) => {
                          const max = Math.max(...weeks.map((w) => w.count));
                          const intensity = max > 0 ? count / max : 0;
                          const bg =
                            intensity > 0.75
                              ? "bg-blue-600 text-white"
                              : intensity > 0.5
                              ? "bg-blue-400 text-white"
                              : intensity > 0.25
                              ? "bg-blue-200 text-blue-800"
                              : "bg-blue-50 text-blue-600";

                          return (
                            <div
                              key={weekNumber}
                              className={`flex flex-col items-center rounded-lg px-3 py-2 ${bg}`}
                            >
                              <span className="text-xs opacity-80">Sem {weekNumber}</span>
                              <span className="text-lg font-bold">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex items-center gap-1.5">
                        <div className="h-2 w-full rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-blue-500 transition-all"
                            style={{
                              width: `${Math.round((weeks.length / season.num_weeks) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="shrink-0 text-xs text-gray-400">
                          {weeks.length}/{season.num_weeks} sem.
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-base font-medium text-gray-900">{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">
        {value}
        {suffix && <span className="ml-1.5 text-sm font-normal text-gray-500">{suffix}</span>}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-gray-400">Carregando...</p>
    </div>
  );
}
