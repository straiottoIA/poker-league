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
        <p className="text-sm text-slate-400">Carregando...</p>
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
    <div className="mx-auto max-w-2xl py-6 px-4">
      {/* Header do perfil */}
      <div className="mb-8 flex items-center gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white shadow-sm">
          {initials}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{user.email}</h1>
          <span className="mt-1 inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
            Administrador
          </span>
        </div>
      </div>

      {/* Abas */}
      <div className="mb-6 border-b border-slate-200">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── RESUMO ── */}
      {activeTab === "resumo" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-5">
            <InfoRow label="E-mail" value={user.email ?? "—"} />
            <InfoRow label="Função" value="Administrador" />
            <InfoRow label="Membro desde" value={memberSince} />
            <InfoRow label="Último acesso" value={lastLogin} />
          </div>
          <div className="mt-8 border-t border-slate-100 pt-6">
            <button
              onClick={handleLogout}
              className="w-full rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
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
                <StatCard label="Temporadas" value={stats.totalSeasons} color="indigo" />
                <StatCard label="Jogadores" value={stats.totalPlayers} color="violet" />
                <StatCard label="Semanas Registradas" value={stats.totalWeeksPlayed} color="sky" />
                <StatCard label="Total de Presenças" value={stats.totalAttendances} color="emerald" />
                <div className="col-span-2">
                  <StatCard
                    label="Média de Presenças / Semana"
                    value={stats.avgAttendancePerWeek}
                    suffix="jogadores"
                    color="indigo"
                  />
                </div>
              </div>

              {stats.activeSeason ? (
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                      Temporada Ativa
                    </p>
                    <p className="mt-1 text-lg font-bold text-emerald-900">
                      {stats.activeSeason.name}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {stats.activeSeason.num_weeks} semanas
                  </span>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm text-amber-700">Nenhuma temporada ativa no momento.</p>
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
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
              <p className="text-sm text-slate-400">Nenhum dado de presença encontrado.</p>
            </div>
          )}
          {!dataLoading && attendance && attendance.length > 0 && (
            <div className="space-y-5">
              {attendance.map(({ season, weeks, total }) => (
                <div
                  key={season.id}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{season.name}</h3>
                    <div className="flex items-center gap-2">
                      {season.is_active && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          Ativa
                        </span>
                      )}
                      <span className="text-xs font-medium text-slate-400">
                        {total} presenças
                      </span>
                    </div>
                  </div>

                  {weeks.length === 0 ? (
                    <p className="text-sm text-slate-400">Sem presenças registradas.</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {weeks.map(({ weekNumber, count }) => {
                          const max = Math.max(...weeks.map((w) => w.count));
                          const intensity = max > 0 ? count / max : 0;
                          const bg =
                            intensity > 0.75
                              ? "bg-indigo-600 text-white"
                              : intensity > 0.5
                              ? "bg-indigo-400 text-white"
                              : intensity > 0.25
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-indigo-50 text-indigo-500";

                          return (
                            <div
                              key={weekNumber}
                              className={`flex flex-col items-center rounded-lg px-3 py-2 ${bg}`}
                            >
                              <span className="text-xs opacity-75">S{weekNumber}</span>
                              <span className="text-lg font-bold">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <div className="h-1.5 w-full rounded-full bg-slate-100">
                          <div
                            className="h-1.5 rounded-full bg-indigo-500 transition-all"
                            style={{
                              width: `${Math.round((weeks.length / season.num_weeks) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="shrink-0 text-xs font-medium text-slate-400">
                          {weeks.length}/{season.num_weeks}
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
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-base font-medium text-slate-900">{value}</p>
    </div>
  );
}

type StatColor = "indigo" | "violet" | "sky" | "emerald";

function StatCard({
  label,
  value,
  suffix,
  color = "indigo",
}: {
  label: string;
  value: number;
  suffix?: string;
  color?: StatColor;
}) {
  const colors: Record<StatColor, string> = {
    indigo: "text-indigo-600",
    violet: "text-violet-600",
    sky: "text-sky-600",
    emerald: "text-emerald-600",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1.5 text-3xl font-bold ${colors[color]}`}>
        {value}
        {suffix && <span className="ml-1.5 text-sm font-normal text-slate-500">{suffix}</span>}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Carregando...
      </div>
    </div>
  );
}
