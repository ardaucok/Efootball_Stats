import { useEffect, useState } from 'react';
import { BarChart3, Plus, Save, X, Download, Image as ImageIcon, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase, type Standing } from '@/lib/supabase';
import ImagePicker from '@/components/ImagePicker';

function LeagueStatsPage({ onTeamClick }: { onTeamClick?: (team: string, season: string) => void }) {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [editing, setEditing] = useState<Standing | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ team: '', played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0, season: '2025-2026', logo_url: '' as string | null });

  const load = async () => {
    const { data } = await supabase.from('standings').select('*').order('points', { ascending: false });
    if (data) setStandings(data);
  };

  useEffect(() => { void load(); }, []);

  const open = (row?: Standing) => {
    setEditing(row || null);
    setForm(row
      ? { team: row.team, played: row.played, won: row.won, drawn: row.drawn, lost: row.lost, goals_for: row.goals_for, goals_against: row.goals_against, points: row.points, season: row.season || '2025-2026', logo_url: row.logo_url }
      : { team: '', played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0, season: '2025-2026', logo_url: null });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.team.trim()) return;
    const payload = { ...form, logo_url: form.logo_url || null };
    const result = editing
      ? await supabase.from('standings').update(payload).eq('id', editing.id)
      : await supabase.from('standings').insert(payload);
    if (!result.error) {
      setShowForm(false);
      setEditing(null);
      await load();
    } else {
      setMessage(result.error.message);
    }
  };

  const setNumber = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: Number(value) || 0 }));

  const exportExcel = () => {
    const rows = standings.map((row) => ({
      Team: row.team,
      Played: row.played,
      Won: row.won,
      Drawn: row.drawn,
      Lost: row.lost,
      GoalsFor: row.goals_for,
      GoalsAgainst: row.goals_against,
      GoalDifference: row.goals_for - row.goals_against,
      Points: row.points,
      Season: row.season,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Team Stats');
    XLSX.writeFile(wb, `league_stats-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleTeamClick = (team: string, season: string) => {
    if (onTeamClick) onTeamClick(team, season);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-blue-400 font-medium mb-2">COMPETITION OVERVIEW</p>
          <h2 className="text-3xl font-bold tracking-tight">League Stats</h2>
          <p className="text-slate-500 mt-2">Keep an eye on the table and team performance.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="flex items-center gap-2 self-start px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800">
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button onClick={() => open()} className="flex items-center gap-2 self-start px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-400">
            <Plus className="w-4 h-4" /> Add team
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-3 text-sm">{message}</div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="font-semibold">League table</h3>
            <p className="text-xs text-slate-500 mt-1">Season 2025-2026 · {standings.length} teams</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-4 w-12">#</th>
                <th className="text-left px-4 py-4">Team</th>
                <th className="text-right px-4 py-4">P</th>
                <th className="text-right px-4 py-4">W</th>
                <th className="text-right px-4 py-4">D</th>
                <th className="text-right px-4 py-4">L</th>
                <th className="text-right px-4 py-4">GF</th>
                <th className="text-right px-4 py-4">GA</th>
                <th className="text-right px-4 py-4">GD</th>
                <th className="text-right px-5 py-4">GF:GA</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, index) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-800/70 last:border-0 hover:bg-slate-800/30 cursor-pointer transition-colors"
                  onClick={() => handleTeamClick(row.team, row.season || '2025-2026')}
                >
                  <td className="px-5 py-4 text-slate-500">{index + 1}</td>
                  <td className="px-4 py-4 font-medium text-slate-200">
                    <div className="flex items-center gap-3">
                      {row.logo_url && (
                        <img src={row.logo_url} alt={row.team} className="w-7 h-7 object-contain rounded" />
                      )}
                      {row.team}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-slate-400">{row.played}</td>
                  <td className="px-4 py-4 text-right text-slate-400">{row.won}</td>
                  <td className="px-4 py-4 text-right text-slate-400">{row.drawn}</td>
                  <td className="px-4 py-4 text-right text-slate-400">{row.lost}</td>
                  <td className="px-4 py-4 text-right text-slate-400">{row.goals_for}</td>
                  <td className="px-4 py-4 text-right text-slate-400">{row.goals_against}</td>
                  <td className="px-4 py-4 text-right text-slate-400">{row.goals_for - row.goals_against}</td>
                  <td className="px-5 py-4 text-right font-bold text-blue-400">{row.goals_for}:{row.goals_against}</td>
                  <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => open(row)} className="text-xs text-slate-500 hover:text-white">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!standings.length && (
            <div className="py-16 text-center">
              <BarChart3 className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No league data yet</p>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h3 className="font-semibold">{editing ? 'Edit league team' : 'Add league team'}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <label className="col-span-2 sm:col-span-3 text-xs text-slate-400">
                Team
                <input
                  value={form.team}
                  onChange={(e) => setForm({ ...form, team: e.target.value })}
                  className="mt-1.5 w-full bg-white border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-900"
                />
              </label>

              <div className="col-span-2 sm:col-span-3">
                <span className="text-xs text-slate-400">Team Logo</span>
                <div className="mt-1.5 flex items-center gap-3">
                  {form.logo_url ? (
                    <div className="relative">
                      <img src={form.logo_url} alt="logo" className="w-14 h-14 object-contain rounded-lg border border-slate-700 bg-white/5" />
                      <button
                        onClick={() => setForm({ ...form, logo_url: null })}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-lg border border-dashed border-slate-700 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-slate-600" />
                    </div>
                  )}
                  <button
                    onClick={() => setShowImagePicker(true)}
                    className="px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800"
                  >
                    Select Logo
                  </button>
                </div>
              </div>

              {(['played', 'won', 'drawn', 'lost', 'goals_for', 'goals_against', 'points'] as (keyof typeof form)[]).map((key) => (
                <label key={key} className="text-xs text-slate-400 capitalize">
                  {key.replace('_', ' ')}
                  <input
                    type="number"
                    value={form[key] as number}
                    onChange={(e) => setNumber(key, e.target.value)}
                    className="mt-1.5 w-full bg-white border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-900"
                  />
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 p-5 border-t border-slate-800 sticky bottom-0 bg-slate-900">
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
              <button onClick={save} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold">
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showImagePicker && (
        <ImagePicker
          category="teams"
          currentUrl={form.logo_url}
          onSelect={(url) => setForm((current) => ({ ...current, logo_url: url }))}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
}

export default LeagueStatsPage;
