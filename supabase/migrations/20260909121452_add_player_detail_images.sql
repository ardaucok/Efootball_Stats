/*
# Add player image gallery and profile image

1. Purpose
- Each player now has a detail page with images and awards.
- We need a profile image URL on the player row and a gallery table for multiple images.

2. Modified table: players
- Add `image_url` (text) — main profile / card image for the player.

3. New table: player_images
- `id` (uuid, primary key)
- `player_id` (uuid, references players, ON DELETE CASCADE)
- `image_url` (text, not null) — gallery image URL
- `caption` (text) — optional caption
- `created_at` (timestamptz)

4. Security
- RLS enabled on player_images.
- Single-tenant public CRUD: anon + authenticated (data is intentionally shared).

5. Notes
- Safe to re-run (uses IF NOT EXISTS / DROP POLICY IF EXISTS).
*/

ALTER TABLE players ADD COLUMN IF NOT EXISTS image_url text;

CREATE TABLE IF NOT EXISTS player_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE player_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_player_images_tbl" ON player_images;
CREATE POLICY "anon_select_player_images_tbl" ON player_images FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_player_images_tbl" ON player_images;
CREATE POLICY "anon_insert_player_images_tbl" ON player_images FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_player_images_tbl" ON player_images;
CREATE POLICY "anon_update_player_images_tbl" ON player_images FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_player_images_tbl" ON player_images;
CREATE POLICY "anon_delete_player_images_tbl" ON player_images FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_player_images_player_id ON player_images(player_id);
