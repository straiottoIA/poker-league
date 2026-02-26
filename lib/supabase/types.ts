export interface Season {
  id: string;
  name: string;
  num_weeks: number;
  is_active: boolean;
  created_at: string;
}

export interface SeasonWithCount extends Season {
  player_count: number;
}

export interface Player {
  id: string;
  name: string;
  created_at: string;
}

export interface SeasonPlayer {
  id: string;
  season_id: string;
  player_id: string;
}

export interface Score {
  id: string;
  season_id: string;
  player_id: string;
  week_number: number;
  points: number;
  attended: boolean;
  created_at: string;
}

export interface LeaderboardEntry {
  player_id: string;
  player_name: string;
  total_points: number;
  weeks_attended: number;
  rank: number;
}

export interface WeekScore {
  player_id: string;
  player_name: string;
  points: number;
  attended: boolean;
}

export interface AllTimePlayerStat {
  player_id: string;
  player_name: string;
  total_points: number;
  weeks_attended: number;
  total_weeks: number;
  attendance_pct: number;
  seasons_played: number;
  wins: number;
  podiums: number;
  avg_points: number;
}

export interface SeasonSummary {
  season_id: string;
  season_name: string;
  is_active: boolean;
  num_weeks: number;
  weeks_played: number;
  total_attendances: number;
  top_player: string | null;
  top_points: number;
}
