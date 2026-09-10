import { useEffect, useState } from 'react';
import { ArrowLeft, BarChart3, Users, Trophy, Shield, Target, TrendingUp } from 'lucide-react';
import { supabase, type Standing, type Player, type PlayerTeam, type Trophy } from '@/lib/supabase';

type TeamSeasonDetailPageProps = {
  team: string;
  season: string;
  onBack: () => void;
  onPlayerClick: (playerId: string) => void;
};

function TeamSeasonDetailPage({ team, season, onBack, onPlayerClick }: TeamSeasonDetailPageProps) {
  const [standing, setStanding] = useState<Standing | null>(null);
  const [players, setPlayers] = useState<(PlayerTeam & { player?: Player })[]>([]);
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [{ data: standingData }, { data: playerTeamsData }, { data: trophiesData }] = await Promise.all([
        supabase.from('standings').select('*').eq('team', team).eq('season', season).maybeSingle(),
        supabase.from('player_teams').select('*').eq('team_name', team).eq('season', season),
        supabase.from('trophies').select('*').eq('team', team),
      ]);

      setStanding(standingData as Standing | null);
      setTrophies((trophiesData as Trophy[]) || []);

      if (playerTeamsData && playerTeamsData.length > 0) {
        const playerIds = playerTeamsData.map((pt) => pt.player_id);
        const { data: playersData } = await supabase.from('players').select('*').in('id', playerIds);
        const playerMap = new Map((playersData || []).map((p) => [p.id, p]));
        setPlayers(playerTeamsData.map((pt) => ({ ...pt, player: playerMap.get(pt.player_id) })));
      } else {
        setPlayers([]);
      }

      setLoading(false);
    };

    void load();
  }, [team, season]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const winRate = standing ? Math.round((standing.won / Math.max(standing.played, 1)) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to League Stats
      </button>

      {/* Header card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          {standing?.logo_url ? (
            <img src={standing.logo_url} alt={team} className="w-16 h-16 object-contain rounded-xl bg-white/5 p-2" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center">
              <Shield className="w-8 h-8 text-slate-500" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">{team}</h2>
            <p className="text-sm text-slate-400 mt-1">Season {season}</p>
          </div>
        </div>

        {standing && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <StatCard icon={BarChart3} label="Played" value={standing.played} />
            <StatCard icon={TrendingUp} label="Win Rate" value={`${winRate}%`} />
            <StatCard icon={Target} label="Goals For" value={standing.goals_for} />
            <StatCard icon={Trophy} label="Points" value={standing.points} accent="text-blue-400" />
          </div>
        )}
      </div>

      {/* Detailed stats */}
      {standing && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">Season Statistics</h3>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <DetailStat label="Played" value={standing.played} />
            <DetailStat label="Won" value={standing.won} color="text-green-400" />
            <DetailStat label="Drawn" value={standing.drawn} color="text-yellow-400" />
            <DetailStat label="Lost" value={standing.lost} color="text-red-400" />
            <DetailStat label="Goals For" value={standing.goals_for} />
            <DetailStat label="Goals Against" value={standing.goals_against} />
            <DetailStat label="Goal Difference" value={standing.goals_for - standing.goals_against} color={standing.goals_for - standing.goals_against >= 0 ? 'text-green-400' : 'text-red-400'} />
            <DetailStat label="Points" value={standing.points} color="text-blue-400" />
          </div>
        </div>
      )}

      {/* Squad */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
          <Users className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold">Squad ({players.length})</h3>
        </div>
        {players.length > 0 ? (
          <div className="divide-y divide-slate-800/70">
            {players.map((pt) => {
              const p = pt.player;
              if (!p) return null;
              return (
                <button
                  key={pt.id}
                  onClick={() => onPlayerClick(p.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-800/30 transition-colors text-left"
                >
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <Users className="w-4 h-4 text-slate-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-200 truncate">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.position || '—'} · {p.appearances} apps · {p.goals} goals</p>
                  </div>
                  {pt.team_logo_url && (
                    <img src={pt.team_logo_url} alt={pt.team_name} className="w-6 h-6 object-contain" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Users className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No players linked to this team for this season</p>
          </div>
        )}
      </div>

      {/* Trophies */}
      {trophies.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">Trophies ({trophies.length})</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trophies.map((t) => (
              <div key={t.id} className="bg-slate-800/50 border border-slate-800 rounded-lg p-4 flex items-center gap-3">
                {t.image_url ? (
                  <img src={t.image_url} alt={t.name} className="w-12 h-12 object-contain rounded" />
                ) : (
                  <div className="w-12 h-12 rounded bg-slate-700 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-slate-500" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-slate-200 text-sm">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.season || '—'}</p>
                  {t.player_name && <p className="text-xs text-blue-400 mt-0.5">{t.player_name}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof BarChart3; label: string; value: string | number; accent?: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
      <Icon className="w-4 h-4 text-slate-500 mb-2" />
      <p className="text-2xl font-bold {accent || 'text-white'}">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function DetailStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color || 'text-slate-200'}`}>{value}</p>
    </div>
  );
}

export default TeamSeasonDetailPage;
