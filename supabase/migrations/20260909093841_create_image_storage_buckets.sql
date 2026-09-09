/*
# Create storage buckets for player, team, and trophy images

1. Storage Buckets
- `player-images` — public bucket for player card photos
- `team-images` — public bucket for team logos/photos
- `trophy-images` — public bucket for trophy and award photos

2. Security
- All three buckets are public (anyone can read).
- Insert/Update/Delete allowed by anon and authenticated roles (single-tenant app, no auth).
*/

INSERT INTO storage.buckets (id, name, public) VALUES
  ('player-images', 'player-images', true),
  ('team-images', 'team-images', true),
  ('trophy-images', 'trophy-images', true)
ON CONFLICT (id) DO NOTHING;

-- player-images policies
DROP POLICY IF EXISTS "anon_select_player_images" ON storage.objects;
CREATE POLICY "anon_select_player_images" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'player-images');

DROP POLICY IF EXISTS "anon_insert_player_images" ON storage.objects;
CREATE POLICY "anon_insert_player_images" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'player-images');

DROP POLICY IF EXISTS "anon_update_player_images" ON storage.objects;
CREATE POLICY "anon_update_player_images" ON storage.objects FOR UPDATE
  TO anon, authenticated USING (bucket_id = 'player-images') WITH CHECK (bucket_id = 'player-images');

DROP POLICY IF EXISTS "anon_delete_player_images" ON storage.objects;
CREATE POLICY "anon_delete_player_images" ON storage.objects FOR DELETE
  TO anon, authenticated USING (bucket_id = 'player-images');

-- team-images policies
DROP POLICY IF EXISTS "anon_select_team_images" ON storage.objects;
CREATE POLICY "anon_select_team_images" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'team-images');

DROP POLICY IF EXISTS "anon_insert_team_images" ON storage.objects;
CREATE POLICY "anon_insert_team_images" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'team-images');

DROP POLICY IF EXISTS "anon_update_team_images" ON storage.objects;
CREATE POLICY "anon_update_team_images" ON storage.objects FOR UPDATE
  TO anon, authenticated USING (bucket_id = 'team-images') WITH CHECK (bucket_id = 'team-images');

DROP POLICY IF EXISTS "anon_delete_team_images" ON storage.objects;
CREATE POLICY "anon_delete_team_images" ON storage.objects FOR DELETE
  TO anon, authenticated USING (bucket_id = 'team-images');

-- trophy-images policies
DROP POLICY IF EXISTS "anon_select_trophy_images" ON storage.objects;
CREATE POLICY "anon_select_trophy_images" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'trophy-images');

DROP POLICY IF EXISTS "anon_insert_trophy_images" ON storage.objects;
CREATE POLICY "anon_insert_trophy_images" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'trophy-images');

DROP POLICY IF EXISTS "anon_update_trophy_images" ON storage.objects;
CREATE POLICY "anon_update_trophy_images" ON storage.objects FOR UPDATE
  TO anon, authenticated USING (bucket_id = 'trophy-images') WITH CHECK (bucket_id = 'trophy-images');

DROP POLICY IF EXISTS "anon_delete_trophy_images" ON storage.objects;
CREATE POLICY "anon_delete_trophy_images" ON storage.objects FOR DELETE
  TO anon, authenticated USING (bucket_id = 'trophy-images');
