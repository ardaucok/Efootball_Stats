import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Edit3, Search, Upload, Users, X, Save, Trash2, FileSpreadsheet, Plus, Download, ImagePlus } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase, type Player } from '@/lib/supabase';
import { uploadImage } from '@/lib/storage';

type PlayerForm = Omit<Player, 'id' | 'created_at' | 'updated_at'>;
const emptyForm: PlayerForm = { name: '', position: '', team: '', nationality: '', age: null, appearances: 0, goals: 0, assists: 0, yellow_cards: 0, red_cards: 0, minutes_played: 0, rating: 0, card_image_url: '', season: '2025-2026' };

function PlayerStatsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('All positions');
  const [editing, setEditing] = useState<Player | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PlayerForm>(emptyForm);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPlayers = async () => { const { data } = await supabase.from('players').select('*').order('goals', { ascending: false }); if (data) setPlayers(data); };
  useEffect(() => { void loadPlayers(); }, []);

  const filtered = useMemo(() => players.filter((player) => `${player.name} ${player.team || ''}`.toLowerCase().includes(search.toLowerCase()) && (position === 'All positions' || player.position === position)), [players, position, search]);
  const positions = ['All positions', ...Array.from(new Set(players.map((p) => p.position).filter(Boolean) as string[]))];

  const openEdit = (player: Player) => { setEditing(player); setForm({ ...player, rating: Number(player.rating), card_image_url: player.card_image_url || '' }); setShowForm(true); };
  const openNew = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const savePlayer = async () => { if (!form.name.trim()) return; const result = editing ? await supabase.from('players').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id) : await supabase.from('players').insert(form); if (result.error) setMessage(result.error.message); else { setMessage(editing ? 'Player updated' : 'Player added'); setShowForm(false); await loadPlayers(); setTimeout(() => setMessage(''), 2500); } };
  const deletePlayer = async () => { if (!editing) return; const result = await supabase.from('players').delete().eq('id', editing.id); if (!result.error) { setShowForm(false); await loadPlayers(); } };

  const importExcel = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const buffer = await file.arrayBuffer(); const workbook = XLSX.read(buffer, { type: 'array' }); const sheet = workbook.Sheets[workbook.SheetNames[0]]; const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet); const payload = rows.map((row) => ({ ...emptyForm, name: String(row.name || row.Name || row.Player || ''), position: String(row.position || row.Position || ''), team: String(row.team || row.Team || ''), nationality: String(row.nationality || row.Nationality || ''), age: Number(row.age || row.Age) || null, appearances: Number(row.appearances || row.Appearances) || 0, goals: Number(row.goals || row.Goals) || 0, assists: Number(row.assists || row.Assists) || 0, yellow_cards: Number(row.yellow_cards || row.YellowCards) || 0, red_cards: Number(row.red_cards || row.RedCards) || 0, minutes_played: Number(row.minutes_played || row.Minutes) || 0, rating: Number(row.rating || row.Rating) || 0, card_image_url: String(row.card_image_url || row.CardImage || ''), season: String(row.season || row.Season || '2025-2026') })).filter((row) => row.name); if (payload.length) { const result = await supabase.from('players').insert(payload); setMessage(result.error ? result.error.message : `${payload.length} players imported`); await loadPlayers(); setTimeout(() => setMessage(''), 3000); } event.target.value = ''; };

  const importFromArchive = async () => {
    setMessage('Importing from archive...');
    try {
      const response = await fetch('/exports/player_stats.xlsx');
      if (!response.ok) { setMessage('Archive file not found. Place player_stats.xlsx in public/exports/'); return; }
      const buffer = await response.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
      const payload = rows.map((row) => ({ ...emptyForm, name: String(row.name || row.Name || row.Player || ''), position: String(row.position || row.Position || ''), team: String(row.team || row.Team || ''), nationality: String(row.nationality || row.Nationality || ''), age: Number(row.age || row.Age) || null, appearances: Number(row.appearances || row.Appearances) || 0, goals: Number(row.goals || row.Goals) || 0, assists: Number(row.assists || row.Assists) || 0, yellow_cards: Number(row.yellow_cards || row.YellowCards) || 0, red_cards: Number(row.red_cards || row.RedCards) || 0, minutes_played: Number(row.minutes_played || row.Minutes) || 0, rating: Number(row.rating || row.Rating) || 0, card_image_url: String(row.card_image_url || row.CardImage || ''), season: String(row.season || row.Season || '2025-2026') })).filter((row) => row.name);
      if (payload.length) { const result = await supabase.from('players').insert(payload); setMessage(result.error ? result.error.message : `${payload.length} players imported from archive`); await loadPlayers(); } else { setMessage('No valid rows found in archive file'); }
    } catch { setMessage('Failed to read archive file'); }
    setTimeout(() => setMessage(''), 3000);
  };

  const exportExcel = () => {
    const rows = filtered.map((p) => ({
      Name: p.name, Position: p.position, Team: p.team, Nationality: p.nationality, Age: p.age,
      Appearances: p.appearances, Goals: p.goals, Assists: p.assists,
      YellowCards: p.yellow_cards, RedCards: p.red_cards, MinutesPlayed: p.minutes_played,
      Rating: Number(p.rating).toFixed(2), Season: p.season,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Player Stats');
    XLSX.writeFile(wb, `player-stats-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage('player-images', file);
    if (url) setForm((current) => ({ ...current, card_image_url: url }));
    e.target.value = '';
  };

  const setField = (key: keyof PlayerForm, value: string) => setForm((current) => ({ ...current, [key]: ['age', 'appearances', 'goals', 'assists', 'yellow_cards', 'red_cards', 'minutes_played', 'rating'].includes(key) ? (value === '' ? 0 : Number(value)) : value }));

  return <div className="space-y-6 animate-fade-in">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div><p className="text-sm text-emerald-400 font-medium mb-2">PERFORMANCE ARCHIVE</p><h2 className="text-3xl font-bold tracking-tight">Player Stats</h2><p className="text-slate-500 mt-2">Manage every player and their career numbers.</p></div><div className="flex gap-2"><input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 transition-colors"><Upload className="w-4 h-4" /> Import Excel</button><button onClick={importFromArchive} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 transition-colors"><FileSpreadsheet className="w-4 h-4" /> Import from Archive</button><button onClick={exportExcel} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 transition-colors"><Download className="w-4 h-4" /> Export Excel</button><button onClick={openNew} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 transition-colors"><Plus className="w-4 h-4" /> Add player</button></div></div>
    {message && <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 text-sm flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" />{message}</div>}
    <div className="flex flex-col sm:flex-row gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search players or teams..." className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500/50" /></div><select value={position} onChange={(event) => setPosition(event.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-300 outline-none">{positions.map((item) => <option key={item}>{item}</option>)}</select></div>
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"><div className="overflow-x-auto scrollbar-thin"><table className="w-full text-sm"><thead><tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider"><th className="text-left px-5 py-4">Player</th><th className="text-left px-4 py-4">Position</th><th className="text-left px-4 py-4">Team</th><th className="text-right px-4 py-4">Apps</th><th className="text-right px-4 py-4">Goals</th><th className="text-right px-4 py-4">Assists</th><th className="text-right px-4 py-4">Rating</th><th className="px-5 py-4"></th></tr></thead><tbody>{filtered.map((player) => <tr key={player.id} className="border-b border-slate-800/70 last:border-0 hover:bg-slate-800/30 transition-colors"><td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-slate-800 overflow-hidden flex items-center justify-center shrink-0">{player.card_image_url ? <img src={player.card_image_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-4 h-4 text-slate-600" />}</div><div><p className="font-medium text-slate-200">{player.name}</p><p className="text-xs text-slate-500">{player.nationality || '—'}</p></div></div></td><td className="px-4 py-3.5 text-slate-400">{player.position || '—'}</td><td className="px-4 py-3.5 text-slate-400">{player.team || '—'}</td><td className="px-4 py-3.5 text-right text-slate-300">{player.appearances}</td><td className="px-4 py-3.5 text-right font-semibold text-emerald-400">{player.goals}</td><td className="px-4 py-3.5 text-right text-slate-300">{player.assists}</td><td className="px-4 py-3.5 text-right font-semibold text-amber-400">{Number(player.rating).toFixed(2)}</td><td className="px-5 py-3.5 text-right"><button onClick={() => openEdit(player)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"><Edit3 className="w-4 h-4" /></button></td></tr>)}</tbody></table></div>{!filtered.length && <div className="py-16 text-center"><Users className="w-8 h-8 text-slate-700 mx-auto mb-3" /><p className="text-slate-500 text-sm">No players found</p><p className="text-slate-600 text-xs mt-1">Import an Excel file or add your first player</p></div>}<div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-600">Showing {filtered.length} of {players.length} players</div></div>
    {showForm && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"><div className="flex items-center justify-between p-5 border-b border-slate-800"><div><h3 className="font-semibold">{editing ? 'Edit player' : 'Add player'}</h3><p className="text-xs text-slate-500 mt-1">Update performance details and card image</p></div><button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button><input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="player-image-upload" /><label htmlFor="player-image-upload" className="sm:col-span-2 flex items-center gap-2 cursor-pointer text-xs text-emerald-400 hover:text-emerald-300"><ImagePlus className="w-4 h-4" /> Upload player image</label>{([['name', 'Name'], ['position', 'Position'], ['team', 'Team'], ['nationality', 'Nationality'], ['age', 'Age'], ['season', 'Season'], ['appearances', 'Appearances'], ['goals', 'Goals'], ['assists', 'Assists'], ['yellow_cards', 'Yellow cards'], ['red_cards', 'Red cards'], ['minutes_played', 'Minutes played'], ['rating', 'Rating'], ['card_image_url', 'Card image URL']] as [keyof PlayerForm, string][]).map(([key, label]) => <label key={key} className={key === 'card_image_url' ? 'sm:col-span-2 text-xs text-slate-400' : 'text-xs text-slate-400'}>{label}<input type={['age', 'appearances', 'goals', 'assists', 'yellow_cards', 'red_cards', 'minutes_played', 'rating'].includes(key) ? 'number' : 'text'} step={key === 'rating' ? '0.01' : undefined} value={form[key] ?? ''} onChange={(event) => setField(key, event.target.value)} className="mt-1.5 w-full bg-white border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500/50" /></label>)}</div><div className="flex items-center justify-between p-5 border-t border-slate-800"><div>{editing && <button onClick={deletePlayer} className="flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300"><Trash2 className="w-4 h-4" /> Delete</button>}</div><div className="flex gap-2"><button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white">Cancel</button><button onClick={savePlayer} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 text-sm font-semibold hover:bg-emerald-400"><Save className="w-4 h-4" /> Save player</button></div></div></div></div>}
  </div>;
}
export default PlayerStatsPage;
