/*
# Add player archive metrics

1. Purpose
- Add the metrics used by the player's GitHub Excel archive.
- Keep existing player records and legacy columns intact so no stored data is lost.

2. New columns on `players`
- `goal_per_match` (numeric) — goals divided by matches.
- `assists_per_match` (numeric) — assists divided by matches.
- `confidence` (numeric) — archive confidence score.
- `goal_contribution_pm` (numeric) — goal contribution per match.
- `goal_contribution` (numeric) — total goals plus assists.

3. Modified table
- `players` receives five nullable numeric metrics with zero defaults.
- Existing columns such as team and rating are retained in storage for data safety but are no longer used by the player screen.

4. Security
- The existing single-tenant public CRUD RLS policies remain unchanged.

5. Notes
- This migration is additive and safe to re-run.
*/

ALTER TABLE players ADD COLUMN IF NOT EXISTS goal_per_match numeric NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS assists_per_match numeric NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS confidence numeric NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS goal_contribution_pm numeric NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS goal_contribution numeric NOT NULL DEFAULT 0;
