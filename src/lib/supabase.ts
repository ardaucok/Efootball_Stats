import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Player = {
  id: string;
  name: string;
  position: string | null;
  appearances: number;
  goals: number;
  assists: number;
  goal_per_match: number;
  assists_per_match: number;
  confidence: number;
  goal_contribution_pm: number;
  goal_contribution: number;
  season: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type PlayerImage = {
  id: string;
  player_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
};

export type Standing = {
  id: string;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  points: number;
  season: string | null;
  created_at: string;
};

export type Trophy = {
  id: string;
  name: string;
  season: string | null;
  team: string | null;
  image_url: string | null;
  description: string | null;
  created_at: string;
};

export type Award = {
  id: string;
  player_name: string;
  award_type: string | null;
  season: string | null;
  team: string | null;
  image_url: string | null;
  description: string | null;
  created_at: string;
};
