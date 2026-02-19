-- Hall of Fame: campeões e vices de cada temporada
create table hall_of_fame (
  id serial primary key,
  season_number int not null unique,
  champion text not null,
  runner_up text not null
);

alter table hall_of_fame enable row level security;

create policy "Public read access" on hall_of_fame for select using (true);
create policy "Authenticated insert" on hall_of_fame for insert with check (auth.role() = 'authenticated');
create policy "Authenticated update" on hall_of_fame for update using (auth.role() = 'authenticated');
create policy "Authenticated delete" on hall_of_fame for delete using (auth.role() = 'authenticated');

-- Dados: temporadas 1–32
insert into hall_of_fame (season_number, champion, runner_up) values
  (1,  'Ulisses',   'Neudson'),
  (2,  'Neudson',   'Ulisses'),
  (3,  'Edson',     'Neudson'),
  (4,  'Rodrigo',   'Edson'),
  (5,  'Peixe',     'Marcel'),
  (6,  'Edson',     'Bougleux'),
  (7,  'Bougleux',  'Dênis'),
  (8,  'Edson',     'Neudson'),
  (9,  'Biro',      'Edson'),
  (10, 'Ganso',     'Cristiano'),
  (11, 'Rodrigo',   'Edson'),
  (12, 'Rodrigo',   'Edson'),
  (13, 'Edson',     'Teteco'),
  (14, 'Rodrigo',   'Teteco'),
  (15, 'Davi',      'Tiago Recife'),
  (16, 'Rafael',    'Centralina'),
  (17, 'Davi',      'Rafael'),
  (18, 'Davi',      'Cristiano'),
  (19, 'Cristiano', 'Teteco'),
  (20, 'Rafael',    'Teteco'),
  (21, 'Rodrigo',   'Cristiano'),
  (22, 'Teteco',    'Pedro'),
  (23, 'Rodrigo',   'Marcel'),
  (24, 'Pedro',     'Marcelo'),
  (25, 'Cristiano', 'Rafael'),
  (26, 'Cristiano', 'Rafael'),
  (27, 'Marcão',    'Pedro'),
  (28, 'Cristiano', 'Rodrigo'),
  (29, 'Cristian',  'Léo'),
  (30, 'Rafael',    'Edson'),
  (31, 'Rafael',    'Pedro'),
  (32, 'Rodrigo',   'Léo');
