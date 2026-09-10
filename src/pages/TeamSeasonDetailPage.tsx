import { useEffect, useState } from 'react';
import { ArrowLeft, Users, Trophy as TrophyIcon, Shield, Plus, Save, X, Image as ImageIcon, Trash2, UserCircle, Goal, ImagePlus } from 'lucide-react';
import { supabase, type Standing, type Player, type PlayerTeam, type Trophy, type TeamStaff, type TeamPlayerStat } from '@/lib/supabase';
import ImagePicker from '@/components/ImagePicker';

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
  const [showTrophyForm, setShowTrophyForm] = useState(false);
  const [showTrophyImagePicker, setShowTrophyImagePicker] = useState(false);
  const [trophyForm, setTrophyForm] = useState({ name: '', team: '', image_url: '', description: '' });
  const [staff, setStaff] = useState<TeamStaff[]>([]);
  const [playerStats, setPlayerStats] = useState<TeamPlayerStat[]>([]);
  const [loading, setLoading] = useState(true);

  // Staff form
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffForm, setStaffForm] = useState<{ role: 'manager' | 'goalkeeper'; name: string; image_url: string | null }>({ role: 'manager', name: '', image_url: null });
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [showStaffImagePicker, setShowStaffImagePicker] = useState(false);

  // Player stats form
  const [showStatsForm, setShowStatsForm] = useState(false);
  const [statsForm, setStatsForm] = useState<{ player_name: string; goals: number; assists: number }>({ player_name: '', goals: 0, assists: 0 });
  const [editingStatsId, setEditingStatsId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);

    const [{ data: standingData }, { data: playerTeamsData }, { data: trophiesData }, { data: staffData }, { data: statsData }] = await Promise.all([
      supabase.from('standings').select('*').eq('team', team).eq('season', season).maybeSingle(),
      supabase.from('player_teams').select('*').eq('team_name', team),
      supabase.from('trophies').select('*').eq('team', team),
      supabase.from('team_staff').select('*').eq('team_name', team),
      supabase.from('team_player_stats').select('*').eq('team_name', team),
    ]);

    setStanding(standingData as Standing | null);
    setTrophies((trophiesData as Trophy[]) || []);
    setStaff((staffData as TeamStaff[]) || []);
    setPlayerStats((statsData as TeamPlayerStat[]) || []);

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

  useEffect(() => { void load(); }, [team, season]);

  // Staff handlers
  const openStaffForm = (existing?: TeamStaff) => {
    if (existing) {
      setEditingStaffId(existing.id);
      setStaffForm({ role: existing.role, name: existing.name, image_url: existing.image_url });
    } else {
      setEditingStaffId(null);
      setStaffForm({ role: 'manager', name: '', image_url: null });
    }
    setShowStaffForm(true);
  };

  const saveStaff = async () => {
    if (!staffForm.name.trim()) return;
    const payload = { team_name: team, season, role: staffForm.role, name: staffForm.name, image_url: staffForm.image_url };
    if (editingStaffId) {
      await supabase.from('team_staff').update(payload).eq('id', editingStaffId);
    } else {
      await supabase.from('team_staff').insert(payload);
    }
    setShowStaffForm(false);
    setEditingStaffId(null);
    await load();
  };

  const deleteStaff = async (id: string) => {
    await supabase.from('team_staff').delete().eq('id', id);
    await load();
  };

  // Player stats handlers
  const openStatsForm = (existing?: TeamPlayerStat) => {
    if (existing) {
      setEditingStatsId(existing.id);
      setStatsForm({ player_name: existing.player_name, goals: existing.goals, assists: existing.assists });
    } else {
      setEditingStatsId(null);
      setStatsForm({ player_name: '', goals: 0, assists: 0 });
    }
    setShowStatsForm(true);
  };

  const saveStats = async () => {
    if (!statsForm.player_name.trim()) return;
    const payload = { team_name: team, season, player_name: statsForm.player_name, goals: statsForm.goals, assists: statsForm.assists };
    if (editingStatsId) {
      await supabase.from('team_player_stats').update(payload).eq('id', editingStatsId);
    } else {
      await supabase.from('team_player_stats').insert(payload);
    }
    setShowStatsForm(false);
    setEditingStatsId(null);
    await load();
  };

  const deleteStats = async (id: string) => {
    await supabase.from('team_player_stats').delete().eq('id', id);
    await load();
  };

  const saveTrophy = async () => {
    if (!trophyForm.name.trim() || !trophyForm.image_url) return;
    await supabase.from('trophies').insert({ ...trophyForm, team });
    setTrophyForm({ name: '', team: '', image_url: '', description: '' });
    setShowTrophyForm(false);
    await load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const manager = staff.find((s) => s.role === 'manager');
  const goalkeeper = staff.find((s) => s.role === 'goalkeeper');

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-200 transition-colors">
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
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Team trophies</p>
            <p className="text-sm text-slate-300 mt-1">Add the trophies won by this team.</p>
          </div>
          <button onClick={() => setShowTrophyForm(true)} className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold hover:bg-amber-400">
            <Plus className="w-4 h-4" /> Add trophy
          </button>
        </div>
      </div>

      {/* Manager & Goalkeeper */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Manager */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCircle className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold">Manager</h3>
            </div>
            <button onClick={() => manager ? openStaffForm(manager) : openStaffForm()} className="text-xs text-blue-400 hover:text-blue-300">
              {manager ? 'Edit' : '+ Add'}
            </button>
          </div>
          {manager ? (
            <div className="p-5 flex items-center gap-4">
              {manager.image_url ? (
                <img src={manager.image_url} alt={manager.name} className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-slate-500" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-slate-200">{manager.name}</p>
                <p className="text-xs text-slate-500">Manager</p>
              </div>
              <button onClick={() => deleteStaff(manager.id)} className="text-slate-600 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-slate-500 text-sm">No manager added</p>
            </div>
          )}
        </div>

        {/* Goalkeeper */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold">Goalkeeper</h3>
            </div>
            <button onClick={() => goalkeeper ? openStaffForm(goalkeeper) : openStaffForm({ role: 'goalkeeper' } as TeamStaff)} className="text-xs text-blue-400 hover:text-blue-300">
              {goalkeeper ? 'Edit' : '+ Add'}
            </button>
          </div>
          {goalkeeper ? (
            <div className="p-5 flex items-center gap-4">
              {goalkeeper.image_url ? (
                <img src={goalkeeper.image_url} alt={goalkeeper.name} className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-slate-500" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-slate-200">{goalkeeper.name}</p>
                <p className="text-xs text-slate-500">Goalkeeper</p>
              </div>
              <button onClick={() => deleteStaff(goalkeeper.id)} className="text-slate-600 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-slate-500 text-sm">No goalkeeper added</p>
            </div>
          )}
        </div>
      </div>



      {/* Player Stats (manual) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Goal className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">Player Goals & Assists</h3>
          </div>
          <button onClick={() => openStatsForm()} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        {playerStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Player</th>
                  <th className="text-right px-4 py-3">Goals</th>
                  <th className="text-right px-4 py-3">Assists</th>
                  <th className="text-right px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {playerStats.map((ps) => (
                  <tr key={ps.id} className="border-b border-slate-800/70 last:border-0 hover:bg-slate-800/30">
                    <td className="px-5 py-3 font-medium text-slate-200">{ps.player_name}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{ps.goals}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{ps.assists}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => openStatsForm(ps)} className="text-xs text-slate-500 hover:text-white mr-3">Edit</button>
                      <button onClick={() => deleteStats(ps.id)} className="text-xs text-slate-500 hover:text-red-400">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center">
            <Goal className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No player stats added yet</p>
          </div>
        )}
      </div>

      {/* Squad (linked players) */}
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
            <p className="text-slate-500 text-sm">No players linked to this team</p>
          </div>
        )}
      </div>

      {/* Trophies */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
          <TrophyIcon className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold">Team trophies ({trophies.length})</h3>
        </div>
        {trophies.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto p-5">
            {trophies.map((t) => (
              <div key={t.id} className="shrink-0 w-56 bg-slate-800/50 border border-slate-800 rounded-lg p-3 flex items-center gap-3">
                {t.image_url ? <img src={t.image_url} alt={t.name} className="w-16 h-16 object-contain rounded" /> : <TrophyIcon className="w-8 h-8 text-slate-500" />}
                <div className="min-w-0">
                  <p className="font-medium text-slate-200 text-sm truncate">{t.name}</p>
                  <p className="text-xs text-amber-400 mt-1 truncate">{t.team || team}</p>
                  {t.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : <div className="py-10 text-center text-sm text-slate-500">No trophies added yet</div>}
      </div>

      {/* Trophy form modal */}
      {showTrophyForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="flex justify-between p-5 border-b border-slate-800">
              <h3 className="font-semibold">Add team trophy</h3>
              <button onClick={() => setShowTrophyForm(false)}><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-5 space-y-4">
              <label className="block text-xs text-slate-400">Trophy name<input value={trophyForm.name} onChange={(e) => setTrophyForm({ ...trophyForm, name: e.target.value })} className="mt-1.5 w-full bg-white border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-900" /></label>
              <label className="block text-xs text-slate-400">Team name<input value={trophyForm.team} onChange={(e) => setTrophyForm({ ...trophyForm, team: e.target.value })} placeholder={team} className="mt-1.5 w-full bg-white border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-900" /></label>
              <div>
                <span className="text-xs text-slate-400">Trophy image</span>
                <div className="mt-1.5 flex items-center gap-3">
                  {trophyForm.image_url ? <img src={trophyForm.image_url} alt="trophy" className="w-16 h-16 object-contain rounded-lg bg-white/5" /> : <div className="w-16 h-16 rounded-lg border border-dashed border-slate-700 flex items-center justify-center"><ImagePlus className="w-5 h-5 text-slate-600" /></div>}
                  <button onClick={() => setShowTrophyImagePicker(true)} className="px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800">Select image</button>
                </div>
              </div>
              <label className="block text-xs text-slate-400">Description<textarea rows={3} value={trophyForm.description} onChange={(e) => setTrophyForm({ ...trophyForm, description: e.target.value })} className="mt-1.5 w-full bg-white border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-900 resize-none" /></label>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-slate-800"><button onClick={() => setShowTrophyForm(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button><button onClick={saveTrophy} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold"><Save className="w-4 h-4" /> Save</button></div>
          </div>
        </div>
      )}
      {showTrophyImagePicker && <ImagePicker category="trophies" currentUrl={trophyForm.image_url} onSelect={(url) => setTrophyForm((current) => ({ ...current, image_url: url }))} onClose={() => setShowTrophyImagePicker(false)} />}

      {/* Staff form modal */}
      {showStaffForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="flex justify-between p-5 border-b border-slate-800">
              <h3 className="font-semibold">{editingStaffId ? 'Edit' : 'Add'} {staffForm.role === 'manager' ? 'Manager' : 'Goalkeeper'}</h3>
              <button onClick={() => { setShowStaffForm(false); setEditingStaffId(null); }}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setStaffForm({ ...staffForm, role: 'manager' })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${staffForm.role === 'manager' ? 'bg-blue-500 text-white' : 'border border-slate-700 text-slate-400'}`}
                >
                  Manager
                </button>
                <button
                  onClick={() => setStaffForm({ ...staffForm, role: 'goalkeeper' })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${staffForm.role === 'goalkeeper' ? 'bg-blue-500 text-white' : 'border border-slate-700 text-slate-400'}`}
                >
                  Goalkeeper
                </button>
              </div>
              <label className="block text-xs text-slate-400">
                Name
                <input
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="mt-1.5 w-full bg-white border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-900"
                />
              </label>
              <div>
                <span className="text-xs text-slate-400">Image</span>
                <div className="mt-1.5 flex items-center gap-3">
                  {staffForm.image_url ? (
                    <div className="relative">
                      <img src={staffForm.image_url} alt="staff" className="w-14 h-14 rounded-full object-cover" />
                      <button
                        onClick={() => setStaffForm({ ...staffForm, image_url: null })}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full border border-dashed border-slate-700 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-slate-600" />
                    </div>
                  )}
                  <button
                    onClick={() => setShowStaffImagePicker(true)}
                    className="px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800"
                  >
                    Select Image
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-slate-800">
              <button onClick={() => { setShowStaffForm(false); setEditingStaffId(null); }} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
              <button onClick={saveStaff} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold">
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player stats form modal */}
      {showStatsForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="flex justify-between p-5 border-b border-slate-800">
              <h3 className="font-semibold">{editingStatsId ? 'Edit' : 'Add'} Player Stats</h3>
              <button onClick={() => { setShowStatsForm(false); setEditingStatsId(null); }}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <label className="block text-xs text-slate-400">
                Player Name
                <input
                  value={statsForm.player_name}
                  onChange={(e) => setStatsForm({ ...statsForm, player_name: e.target.value })}
                  className="mt-1.5 w-full bg-white border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-900"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-xs text-slate-400">
                  Goals
                  <input
                    type="number"
                    value={statsForm.goals}
                    onChange={(e) => setStatsForm({ ...statsForm, goals: Number(e.target.value) || 0 })}
                    className="mt-1.5 w-full bg-white border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-900"
                  />
                </label>
                <label className="block text-xs text-slate-400">
                  Assists
                  <input
                    type="number"
                    value={statsForm.assists}
                    onChange={(e) => setStatsForm({ ...statsForm, assists: Number(e.target.value) || 0 })}
                    className="mt-1.5 w-full bg-white border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-900"
                  />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-slate-800">
              <button onClick={() => { setShowStatsForm(false); setEditingStatsId(null); }} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
              <button onClick={saveStats} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold">
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image picker for staff */}
      {showStaffImagePicker && (
        <ImagePicker
          category="players"
          currentUrl={staffForm.image_url}
          onSelect={(url) => setStaffForm((current) => ({ ...current, image_url: url }))}
          onClose={() => setShowStaffImagePicker(false)}
        />
      )}
    </div>
  );
}

export default TeamSeasonDetailPage;
