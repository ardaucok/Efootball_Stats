import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Player = {
  id: string;
  name: string;
  position: string | null;
  team: string | null;
  nationality: string | null;
  age: number | null;
  appearances: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  minutes_played: number;
  rating: number;
  card_image_url: string | null;
  season: string | null;
  created_at: string;
  updated_at: string;
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
