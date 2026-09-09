/*
# Football Stat Tracker Schema

## Overview
Creates the full schema for a football stat tracker application — a single-tenant
(no auth) app that stores player stats, league/standings data, trophies, and
awarded players. Data is imported from local Excel files and can be manually
edited. Images (player cards, trophy images, award images) are stored as URLs.

## New Tables

### players
- `id` (uuid, primary key)
- `name` (text, not null) — player full name
- `position` (text) — playing position (GK, DEF, MID, FWD, etc.)
- `team` (text) — current club
- `nationality` (text) — country
- `age` (int) — player age
- `appearances` (int, default 0) — matches played
- `goals` (int, default 0) — total goals
- `assists` (int, default 0) — total assists
- `yellow_cards` (int, default 0)
- `red_cards` (int, default 0)
- `minutes_played` (int, default 0)
- `rating` (numeric(4,2), default 0) — average match rating
- `card_image_url` (text) — player card visual URL
- `season` (text) — e.g. "2025-2026"
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### standings
- `id` (uuid, primary key)
- `team` (text, not null) — club name
- `played` (int, default 0) — matches played
- `won` (int, default 0)
- `drawn` (int, default 0)
- `lost` (int, default 0)
- `goals_for` (int, default 0)
- `goals_against` (int, default 0)
- `points` (int, default 0)
- `season` (text)
- `created_at` (timestamptz)

### trophies
- `id` (uuid, primary key)
- `name` (text, not null) — trophy/competition name
- `season` (text) — season won
- `team` (text) — winning team
- `image_url` (text) — trophy image URL
- `description` (text)
- `created_at` (timestamptz)

### awards
- `id` (uuid, primary key)
- `player_name` (text, not null) — awarded player
- `award_type` (text) — e.g. "Top Scorer", "Best Player", "Golden Boot"
- `season` (text)
- `team` (text)
- `image_url` (text) — award image URL
- `description` (text)
- `created_at` (timestamptz)

## Security
- Single-tenant app, no sign-in. RLS enabled on every table.
- Policies allow anon + authenticated full CRUD (data is intentionally shared/public).
*/

CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position text,
  team text,
  nationality text,
  age int,
  appearances int NOT NULL DEFAULT 0,
  goals int NOT NULL DEFAULT 0,
  assists int NOT NULL DEFAULT 0,
  yellow_cards int NOT NULL DEFAULT 0,
  red_cards int NOT NULL DEFAULT 0,
  minutes_played int NOT NULL DEFAULT 0,
  rating numeric(4,2) NOT NULL DEFAULT 0,
  card_image_url text,
  season text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_players" ON players;
CREATE POLICY "anon_select_players" ON players FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_players" ON players;
CREATE POLICY "anon_insert_players" ON players FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_players" ON players;
CREATE POLICY "anon_update_players" ON players FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_players" ON players;
CREATE POLICY "anon_delete_players" ON players FOR DELETE
  TO anon, authenticated USING (true);


CREATE TABLE IF NOT EXISTS standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team text NOT NULL,
  played int NOT NULL DEFAULT 0,
  won int NOT NULL DEFAULT 0,
  drawn int NOT NULL DEFAULT 0,
  lost int NOT NULL DEFAULT 0,
  goals_for int NOT NULL DEFAULT 0,
  goals_against int NOT NULL DEFAULT 0,
  points int NOT NULL DEFAULT 0,
  season text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE standings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_standings" ON standings;
CREATE POLICY "anon_select_standings" ON standings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_standings" ON standings;
CREATE POLICY "anon_insert_standings" ON standings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_standings" ON standings;
CREATE POLICY "anon_update_standings" ON standings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_standings" ON standings;
CREATE POLICY "anon_delete_standings" ON standings FOR DELETE
  TO anon, authenticated USING (true);


CREATE TABLE IF NOT EXISTS trophies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  season text,
  team text,
  image_url text,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trophies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_trophies" ON trophies;
CREATE POLICY "anon_select_trophies" ON trophies FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_trophies" ON trophies;
CREATE POLICY "anon_insert_trophies" ON trophies FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_trophies" ON trophies;
CREATE POLICY "anon_update_trophies" ON trophies FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_trophies" ON trophies;
CREATE POLICY "anon_delete_trophies" ON trophies FOR DELETE
  TO anon, authenticated USING (true);


CREATE TABLE IF NOT EXISTS awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  award_type text,
  season text,
  team text,
  image_url text,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE awards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_awards" ON awards;
CREATE POLICY "anon_select_awards" ON awards FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_awards" ON awards;
CREATE POLICY "anon_insert_awards" ON awards FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_awards" ON awards;
CREATE POLICY "anon_update_awards" ON awards FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_awards" ON awards;
CREATE POLICY "anon_delete_awards" ON awards FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_players_season ON players(season);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team);
CREATE INDEX IF NOT EXISTS idx_standings_season ON standings(season);
CREATE INDEX IF NOT EXISTS idx_trophies_season ON trophies(season);
CREATE INDEX IF NOT EXISTS idx_awards_season ON awards(season);