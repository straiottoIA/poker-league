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
        <p className="font-body text-sm text-muted">Carregando...</p>
      </div>
    );
  }

  if (!user) return null;

  const displayName =
    (user.user_metadata?.username as string | undefined) ??
    user.email?.replace("@ttpf.local", "") ??
    "?";
  const initials = displayName.charAt(0).toUpperCase();
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
    <div className="mx-auto max-w-2xl space-y-10">
      {/* Profile header */}
      <div className="border-b-2 border-ink pb-8">
        <div className="flex items-center gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-ink font-heading text-2xl font-bold text-canvas">
            {initials}
          </div>
          <div>
            <p className="font-body text-[10px] font-bold uppercase tracking-[3px] text-crimson">
              Administrador
            </p>
            <h1 className="mt-1 font-heading text-2xl font-bold text-ink capitalize">{displayName}</h1>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b-2 border-ink">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-0.5 border-b-2 px-5 pb-3 font-body text-[11px] font-bold uppercase tracking-[2px] transition-colors ${
                activeTab === tab.id
                  ? "border-crimson text-crimson"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── RESUMO ── */}
      {activeTab === "resumo" && (
        <div className="border border-border-strong bg-surface p-8">
          <div className="space-y-6">
            <InfoRow label="Usuário" value={displayName} />
            <InfoRow label="Função" value="Administrador" />
            <InfoRow label="Membro desde" value={memberSince} />
            <InfoRow label="Último acesso" value={lastLogin} />
          </div>
          <div className="mt-10 border-t border-border-subtle pt-6">
            <button
              onClick={handleLogout}
              className="w-full border-2 border-ink bg-transparent py-3 font-body text-[11px] font-bold uppercase tracking-[2px] text-ink transition-all hover:bg-ink hover:text-canvas"
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
              <div className="grid grid-cols-2 border border-border-strong bg-surface sm:grid-cols-3">
                <MiniStatBar label="Temporadas" value={stats.totalSeasons} />
                <MiniStatBar label="Jogadores" value={stats.totalPlayers} />
                <MiniStatBar label="Semanas" value={stats.totalWeeksPlayed} />
                <MiniStatBar label="Presenças" value={stats.totalAttendances} />
                <div className="col-span-2 border-t border-border-subtle sm:col-span-2">
                  <MiniStatBar label="Média / Semana" value={stats.avgAttendancePerWeek} suffix="jog." last />
                </div>
              </div>

              {stats.activeSeason ? (
                <div className="flex items-center justify-between border-l-4 border-crimson border border-border-subtle bg-surface px-6 py-4">
                  <div>
                    <p className="font-body text-[10px] font-bold uppercase tracking-[3px] text-crimson">
                      Temporada Ativa
                    </p>
                    <p className="mt-1 font-heading text-xl font-bold text-ink">{stats.activeSeason.name}</p>
                  </div>
                  <span className="bg-crimson px-3 py-1 font-body text-[10px] font-bold uppercase tracking-[2px] text-white">
                    {stats.activeSeason.num_weeks} sem.
                  </span>
                </div>
              ) : (
                <div className="border border-border-strong bg-surface px-6 py-4">
                  <p className="font-body text-sm text-muted">Nenhuma temporada ativa no momento.</p>
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
            <div className="border border-border-strong bg-surface px-8 py-12 text-center">
              <p className="font-body text-sm text-muted">Nenhum dado de presença encontrado.</p>
            </div>
          )}
          {!dataLoading && attendance && attendance.length > 0 && (
            <div className="space-y-6">
              {attendance.map(({ season, weeks, total }) => (
                <div
                  key={season.id}
                  className="border border-border-strong bg-surface p-6"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="font-heading text-lg font-bold text-ink">{season.name}</h3>
                    <div className="flex items-center gap-3">
                      {season.is_active && (
                        <span className="bg-crimson px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-[2px] text-white">
                          Ativa
                        </span>
                      )}
                      <span className="font-body text-[11px] font-bold uppercase tracking-[2px] text-muted">
                        {total} presenças
                      </span>
                    </div>
                  </div>

                  {weeks.length === 0 ? (
                    <p className="font-body text-sm text-muted">Sem presenças registradas.</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {weeks.map(({ weekNumber, count }) => {
                          const max = Math.max(...weeks.map((w) => w.count));
                          const intensity = max > 0 ? count / max : 0;
                          const bg =
                            intensity > 0.75
                              ? "bg-crimson text-white"
                              : intensity > 0.5
                              ? "bg-[rgba(229,57,53,0.5)] text-white"
                              : intensity > 0.25
                              ? "bg-[rgba(229,57,53,0.2)] text-ink"
                              : "bg-[rgba(229,57,53,0.06)] text-ink";

                          return (
                            <div
                              key={weekNumber}
                              className={`flex flex-col items-center px-3 py-2 ${bg}`}
                            >
                              <span className="font-body text-[10px] font-bold uppercase tracking-[1px] opacity-70">
                                S{weekNumber}
                              </span>
                              <span className="font-heading text-lg font-bold">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-5 flex items-center gap-3">
                        <div className="h-1 w-full bg-border-strong">
                          <div
                            className="h-1 bg-crimson transition-all"
                            style={{
                              width: `${Math.round((weeks.length / season.num_weeks) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="shrink-0 font-body text-[11px] font-bold uppercase tracking-[2px] text-muted">
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
    <div className="flex items-baseline justify-between gap-4 border-b border-border-subtle pb-4">
      <p className="shrink-0 font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">{label}</p>
      <p className="font-body text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

function MiniStatBar({ label, value, suffix, last }: { label: string; value: number; suffix?: string; last?: boolean }) {
  return (
    <div className={`p-6 text-center ${!last ? "border-r border-border-subtle" : ""}`}>
      <p className="font-heading text-3xl font-bold text-crimson">
        {value}
        {suffix && <span className="ml-1 font-body text-sm font-normal text-muted">{suffix}</span>}
      </p>
      <p className="mt-1 font-body text-[10px] font-bold uppercase tracking-[2px] text-muted">{label}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="font-body text-sm text-muted">Carregando...</p>
    </div>
  );
}
