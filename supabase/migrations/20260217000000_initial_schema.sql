-- 1. seasons: tracks each 10-week season
create table seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  num_weeks int not null default 10,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. players: persistent player list across seasons
create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 3. season_players: who is enrolled in which season
create table season_players (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  unique(season_id, player_id)
);

-- 4. scores: attendance + points per player per week
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

-- 5. Row Level Security: public read, authenticated write
alter table seasons enable row level security;
alter table players enable row level security;
alter table season_players enable row level security;
alter table scores enable row level security;

-- SELECT: anyone can read (including anonymous)
create policy "Public read access" on seasons for select using (true);
create policy "Public read access" on players for select using (true);
create policy "Public read access" on season_players for select using (true);
create policy "Public read access" on scores for select using (true);

-- INSERT: only authenticated users
create policy "Authenticated insert" on seasons for insert with check (auth.role() = 'authenticated');
create policy "Authenticated insert" on players for insert with check (auth.role() = 'authenticated');
create policy "Authenticated insert" on season_players for insert with check (auth.role() = 'authenticated');
create policy "Authenticated insert" on scores for insert with check (auth.role() = 'authenticated');

-- UPDATE: only authenticated users
create policy "Authenticated update" on seasons for update using (auth.role() = 'authenticated');
create policy "Authenticated update" on players for update using (auth.role() = 'authenticated');
create policy "Authenticated update" on season_players for update using (auth.role() = 'authenticated');
create policy "Authenticated update" on scores for update using (auth.role() = 'authenticated');

-- DELETE: only authenticated users
create policy "Authenticated delete" on seasons for delete using (auth.role() = 'authenticated');
create policy "Authenticated delete" on players for delete using (auth.role() = 'authenticated');
create policy "Authenticated delete" on season_players for delete using (auth.role() = 'authenticated');
create policy "Authenticated delete" on scores for delete using (auth.role() = 'authenticated');
