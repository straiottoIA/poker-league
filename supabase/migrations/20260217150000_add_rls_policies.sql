-- Enable Row Level Security
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
