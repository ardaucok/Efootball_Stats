import { useEffect, useState } from 'react';
import { ArrowLeft, Award, ImagePlus, Save, Trash2, X, Goal, Users, TrendingUp, Shield, Camera, Plus, Trophy, Building2 } from 'lucide-react';
import { supabase, type Player, type PlayerTeam, type Award as AwardType, type Trophy as TrophyType } from '@/lib/supabase';
import ImagePicker from '@/components/ImagePicker';

type PlayerDetailPageProps = {
  playerId: string;
  onBack: () => void;
};

const statCards: { key: keyof Player; label: string; icon: typeof Goal; decimals?: boolean }[] = [
  { key: 'appearances', label: 'Matches', icon: Users },
  { key: 'goals', label: 'Goals', icon: Goal },
  { key: 'assists', label: 'Assists', icon: TrendingUp },
  { key: 'goal_contribution', label: 'Contribution', icon: Shield },
  { key: 'goal_per_match', label: 'Goals / Match', icon: Goal, decimals: true },
  { key: 'assists_per_match', label: 'Assists / Match', icon: TrendingUp, decimals: true },
  { key: 'confidence', label: 'Confidence', icon: Shield, decimals: true },
  { key: 'goal_contribution_pm', label: 'Contribution / Match', icon: TrendingUp, decimals: true },
];

function PlayerDetailPage({ playerId, onBack }: PlayerDetailPageProps) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [awards, setAwards] = useState<AwardType[]>([]);
  const [teams, setTeams] = useState<PlayerTeam[]>([]);
  const [trophies, setTrophies] = useState<TrophyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAwardForm, setShowAwardForm] = useState(false);
  const [showTrophyForm, setShowTrophyForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showPlayerImagePicker, setShowPlayerImagePicker] = useState(false);
  const [showAwardImagePicker, setShowAwardImagePicker] = useState(false);
  const [showTeamLogoPicker, setShowTeamLogoPicker] = useState(false);
  const [showTrophyImagePicker, setShowTrophyImagePicker] = useState(false);
  const [teamForm, setTeamForm] = useState({ team_name: '', team_logo_url: '', season: '' });
  const [trophyForm, setTrophyForm] = useState({ name: '', season: '', team: '', image_url: '', description: '' });
  const [awardForm, setAwardForm] = useState({ award_type: '', team: '', image_url: '', description: '' });

  useEffect(() => {
    const load = async () => {
      const { data: playerData } = await supabase.from('players').select('*').eq('id', playerId).maybeSingle();
      if (playerData) {
        setPlayer(playerData as Player);
        const player = playerData as Player;
        const [awardResult, teamResult, trophyResult] = await Promise.all([
          supabase.from('awards').select('*').eq('player_name', player.name).order('created_at', { ascending: false }),
          supabase.from('player_teams').select('*').eq('player_id', player.id).order('created_at', { ascending: true }),
          supabase.from('trophies').select('*').eq('player_name', player.name).order('created_at', { ascending: false }),
        ]);
        if (awardResult.data) setAwards(awardResult.data as AwardType[]);
        if (teamResult.data) setTeams(teamResult.data as PlayerTeam[]);
        if (trophyResult.data) setTrophies(trophyResult.data as TrophyType[]);
      }
      setLoading(false);
    };
    void load();
  }, [playerId]);

  const handlePlayerImageSelect = async (url: string) => {
    const { data } = await supabase.from('players').update({ image_url: url }).eq('id', playerId).select('*').single();
    if (data) setPlayer(data as Player);
  };

  const saveAward = async () => {
    if (!player || !awardForm.award_type.trim()) return;
    const { data } = await supabase.from('awards').insert({ player_name: player.name, ...awardForm }).select('*').single();
    if (data) { setAwards((prev) => [data as AwardType, ...prev]); setShowAwardForm(false); setAwardForm({ award_type: '', team: '', image_url: '', description: '' }); }
  };

  const handleAwardImageSelect = (url: string) => {
    setAwardForm((prev) => ({ ...prev, image_url: url }));
  };

  const saveTrophy = async () => {
    if (!player || !trophyForm.name.trim()) return;
    const { data } = await supabase.from('trophies').insert({ player_name: player.name, ...trophyForm }).select('*').maybeSingle();
    if (data) {
      setTrophies((prev) => [data as TrophyType, ...prev]);
      setShowTrophyForm(false);
      setTrophyForm({ name: '', season: '', team: '', image_url: '', description: '' });
    }
  };

  const saveTeam = async () => {
    if (!player || !teamForm.team_name.trim()) return;
    const { data } = await supabase.from('player_teams').insert({ player_id: player.id, ...teamForm }).select('*').maybeSingle();
    if (data) {
      setTeams((prev) => [...prev, data as PlayerTeam]);
      setShowTeamForm(false);
      setTeamForm({ team_name: '', team_logo_url: '', season: '' });
    }
  };

  const handleTeamLogoSelect = (url: string) => {
    setTeamForm((prev) => ({ ...prev, team_logo_url: url }));
  };

  const handleTrophyImageSelect = (url: string) => {
    setTrophyForm((prev) => ({ ...prev, image_url: url }));
  };

  const deleteTeam = async (teamId: string) => {
    const { error } = await supabase.from('player_teams').delete().eq('id', teamId);
    if (!error) setTeams((prev) => prev.filter((team) => team.id !== teamId));
  };

  const deleteAward = async (awardId: string) => {
    const { error } = await supabase.from('awards').delete().eq('id', awardId);
    if (!error) setAwards((prev) => prev.filter((a) => a.id !== awardId));
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!player) return <div className="py-20 text-center"><p className="text-slate-500">Player not found</p><button onClick={onBack} className="mt-4 text-emerald-500 text-sm">Go back</button></div>;

  return <div className="space-y-6 animate-fade-in">
    <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"><ArrowLeft className="w-4 h-4" /> Back to players</button>

    {/* Player header: vertical image + name side by side */}
    <div className="relative rounded-2xl overflow-hidden border border-[#e2e8f0] bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row">
        {/* Vertical image */}
        <div className="relative sm:w-2/5 lg:w-1/3 shrink-0 bg-gradient-to-br from-[#14213d] to-[#2f7d5a] overflow-hidden group">
          <div className="aspect-[3/4] sm:aspect-auto sm:h-full sm:min-h-[320px]">
            {player.image_url ? (
              <img src={player.image_url} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Users className="w-16 h-16 text-white/30" /></div>
            )}
          </div>
          {/* Pick image button */}
          <button onClick={() => setShowPlayerImagePicker(true)} className="absolute top-3 right-3 flex items-center gap-1.5 cursor-pointer px-2.5 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-medium hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-3.5 h-3.5" /> Change
          </button>
        </div>
        {/* Teams + name + trophies */}
        <div className="flex-1 flex flex-col justify-center p-6 lg:p-10">
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-xs text-emerald-500 font-semibold uppercase tracking-wider">{player.position || 'Player'}</p>
            <button onClick={() => setShowTeamForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2f7d5a] text-white text-xs font-semibold hover:bg-[#256548] transition-colors"><Plus className="w-3.5 h-3.5" /> Add team</button>
          </div>
          {teams.length > 0 && <div className="flex flex-wrap gap-2 mb-4">
            {teams.map((team) => <div key={team.id} className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
              {team.team_logo_url ? <img src={team.team_logo_url} alt="" className="w-5 h-5 object-contain" /> : <Building2 className="w-4 h-4 text-[#2f7d5a]" />}
              <span className="text-xs font-medium text-slate-700">{team.team_name}</span>
              {team.season && <span className="text-[10px] text-slate-400">{team.season}</span>}
              <button onClick={() => deleteTeam(team.id)} className="ml-1 text-slate-300 hover:text-rose-500" aria-label={`Remove ${team.team_name}`}><X className="w-3 h-3" /></button>
            </div>)}
          </div>}
          <h2 className="text-3xl lg:text-5xl font-bold tracking-tight text-[#14213d] leading-tight">{player.name}</h2>
          <div className="mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-[#2f7d5a] to-[#d9a441]" />
          {trophies.length > 0 && <div className="mt-5 flex flex-wrap gap-2">
            {trophies.map((trophy) => <div key={trophy.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200" title={trophy.description || trophy.name}>
              {trophy.image_url ? <img src={trophy.image_url} alt="" className="w-5 h-5 object-contain" /> : <Trophy className="w-4 h-4 text-amber-600" />}
              <span className="text-xs font-medium text-amber-900">{trophy.name}</span>
              {trophy.season && <span className="text-[10px] text-amber-700">{trophy.season}</span>}
            </div>)}
          </div>}
        </div>
      </div>
    </div>

    {/* Trophy actions */}
    <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
      <div className="flex items-center gap-3"><Trophy className="w-5 h-5 text-amber-600" /><div><h3 className="text-sm font-semibold text-amber-950">Player trophies</h3><p className="text-xs text-amber-800/70">Add trophies that will appear below the player name.</p></div></div>
      <button onClick={() => setShowTrophyForm(true)} className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"><Plus className="w-4 h-4" /> Add trophy</button>
    </div>

    {/* Stats grid */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {statCards.map((card) => {
        const Icon = card.icon;
        const value = player[card.key];
        return <div key={card.key} className="bg-white border border-[#e2e8f0] rounded-xl p-4 hover:border-[#2f7d5a]/40 hover:shadow-md transition-all">
          <div className="w-9 h-9 rounded-lg bg-[#2f7d5a]/10 flex items-center justify-center mb-3"><Icon className="w-4 h-4 text-[#2f7d5a]" style={{ width: 18, height: 18 }} /></div>
          <p className="text-2xl font-bold tracking-tight text-[#14213d]">{card.decimals ? Number(value || 0).toFixed(3) : value}</p>
          <p className="text-xs text-slate-500 mt-1">{card.label}</p>
        </div>;
      })}
    </div>

    {/* Awards */}
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div><h3 className="font-semibold text-[#14213d]">Awards & Honours</h3><p className="text-xs text-slate-500 mt-1">Trophies and individual achievements</p></div>
        <button onClick={() => setShowAwardForm(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500 text-white text-sm font-semibold hover:bg-rose-400 transition-colors"><Award className="w-4 h-4" /> Add award</button>
      </div>
      {awards.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {awards.map((award) => (
            <div key={award.id} className="group relative bg-[#f8fafc] border border-[#e2e8f0] rounded-xl overflow-hidden hover:border-rose-400/40 transition-colors">
              <div className="aspect-[16/10] bg-gradient-to-br from-rose-50 to-slate-100 flex items-center justify-center overflow-hidden">
                {award.image_url ? <img src={award.image_url} alt={award.award_type || 'Award'} className="w-full h-full object-cover" /> : <Award className="w-12 h-12 text-rose-300" />}
              </div>
              <div className="p-3">
                <p className="text-xs text-rose-500 font-medium uppercase tracking-wide">{award.award_type || 'Award'}</p>
                {award.team && <p className="text-xs text-slate-500 mt-1.5">{award.team}</p>}
                {award.description && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{award.description}</p>}
              </div>
              <button onClick={() => deleteAward(award.id)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center border-2 border-dashed border-[#e2e8f0] rounded-xl">
          <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No awards yet. Add the first honour.</p>
        </div>
      )}
    </div>

    {/* Trophy form modal */}
    {showTrophyForm && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-100"><h3 className="font-semibold text-[#14213d]">Add trophy for {player.name}</h3><button onClick={() => setShowTrophyForm(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button></div>
        <div className="p-5 space-y-4"><button onClick={() => setShowTrophyImagePicker(true)} className="flex items-center gap-2 cursor-pointer text-xs text-amber-600 hover:text-amber-500"><ImagePlus className="w-4 h-4" /> Select trophy image</button>{trophyForm.image_url && <img src={trophyForm.image_url} alt="" className="w-full h-32 object-cover rounded-lg" />}{([['name', 'Trophy name'], ['season', 'Season'], ['team', 'Team'], ['image_url', 'Image URL']] as const).map(([key, label]) => <label key={key} className="block text-xs text-slate-500">{label}<input value={trophyForm[key]} onChange={(e) => setTrophyForm({ ...trophyForm, [key]: e.target.value })} className="mt-1.5 w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400/50" /></label>)}<label className="block text-xs text-slate-500">Description<textarea rows={3} value={trophyForm.description} onChange={(e) => setTrophyForm({ ...trophyForm, description: e.target.value })} className="mt-1.5 w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm resize-none outline-none focus:border-amber-400/50" /></label></div>
        <div className="flex justify-end gap-2 p-5 border-t border-slate-100"><button onClick={() => setShowTrophyForm(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button><button onClick={saveTrophy} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600"><Save className="w-4 h-4" /> Save trophy</button></div>
      </div>
    </div>}

    {/* Team form modal */}
    {showTeamForm && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-100"><h3 className="font-semibold text-[#14213d]">Add team for {player.name}</h3><button onClick={() => setShowTeamForm(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button></div>
        <div className="p-5 space-y-4">
          {([['team_name', 'Team name'], ['season', 'Season']] as const).map(([key, label]) => <label key={key} className="block text-xs text-slate-500">{label}<input value={teamForm[key]} onChange={(e) => setTeamForm({ ...teamForm, [key]: e.target.value })} className="mt-1.5 w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2f7d5a]/50" /></label>)}<div><button onClick={() => setShowTeamLogoPicker(true)} className="flex items-center gap-2 cursor-pointer text-xs text-[#2f7d5a] hover:text-[#256548]"><ImagePlus className="w-4 h-4" /> Select team logo</button>{teamForm.team_logo_url && <img src={teamForm.team_logo_url} alt="" className="mt-2 w-12 h-12 object-contain rounded-lg" />}</div>
        </div>
        <div className="flex justify-end gap-2 p-5 border-t border-slate-100"><button onClick={() => setShowTeamForm(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button><button onClick={saveTeam} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2f7d5a] text-white text-sm font-semibold hover:bg-[#256548]"><Save className="w-4 h-4" /> Save team</button></div>
      </div>
    </div>}

    {/* Award form modal */}
    {showAwardForm && (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 className="font-semibold text-[#14213d]">Add award for {player.name}</h3>
            <button onClick={() => setShowAwardForm(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-4">
            <button onClick={() => setShowAwardImagePicker(true)} className="flex items-center gap-2 cursor-pointer text-xs text-rose-500 hover:text-rose-400"><ImagePlus className="w-4 h-4" /> Select award image</button>
            {([
              ['award_type', 'Award type', 'text'],
              ['team', 'Team', 'text'],
              ['image_url', 'Image URL', 'text'],
            ] as const).map(([key, label, type]) => (
              <label key={key} className="block text-xs text-slate-500">{label}<input type={type} value={awardForm[key]} onChange={(e) => setAwardForm({ ...awardForm, [key]: e.target.value })} className="mt-1.5 w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-rose-400/50" /></label>
            ))}
            <label className="block text-xs text-slate-500">Description<textarea rows={3} value={awardForm.description} onChange={(e) => setAwardForm({ ...awardForm, description: e.target.value })} className="mt-1.5 w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm resize-none outline-none focus:border-rose-400/50" /></label>
          </div>
          <div className="flex justify-end gap-2 p-5 border-t border-slate-100">
            <button onClick={() => setShowAwardForm(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
            <button onClick={saveAward} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 text-white text-sm font-semibold hover:bg-rose-400"><Save className="w-4 h-4" /> Save award</button>
          </div>
        </div>
      </div>
    )}

    {showPlayerImagePicker && (
      <ImagePicker
        category="players"
        currentUrl={player.image_url}
        onSelect={handlePlayerImageSelect}
        onClose={() => setShowPlayerImagePicker(false)}
      />
    )}

    {showAwardImagePicker && (
      <ImagePicker
        category="players"
        currentUrl={awardForm.image_url}
        onSelect={handleAwardImageSelect}
        onClose={() => setShowAwardImagePicker(false)}
      />
    )}

    {showTeamLogoPicker && (
      <ImagePicker
        category="teams"
        currentUrl={teamForm.team_logo_url}
        onSelect={handleTeamLogoSelect}
        onClose={() => setShowTeamLogoPicker(false)}
      />
    )}

    {showTrophyImagePicker && (
      <ImagePicker
        category="trophies"
        currentUrl={trophyForm.image_url}
        onSelect={handleTrophyImageSelect}
        onClose={() => setShowTrophyImagePicker(false)}
      />
    )}
  </div>;
}

export default PlayerDetailPage;
