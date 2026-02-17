-- seasons: tracks each 10-week season
create table seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  num_weeks int not null default 10,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- players: persistent player list across seasons
create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- season_players: who is enrolled in which season
create table season_players (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  unique(season_id, player_id)
);

-- scores: attendance + points per player per week
create table scores (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  week_number int not null check (week_number >= 1),
  points numeric not null default 0,
  attended boolean not null default true,
  created_at timestamptz not null default now(),
  unique(season_id, player_id, week_number)
);

create index idx_scores_season on scores(season_id);
create index idx_scores_season_week on scores(season_id, week_number);
