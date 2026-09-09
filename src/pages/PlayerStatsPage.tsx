import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { ArrowDown, ArrowUp, Download, FileSpreadsheet, Plus, Search, Save, Trash2, Upload, Users, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase, type Player } from '@/lib/supabase';

type PlayerForm = Omit<Player, 'id' | 'created_at' | 'updated_at'>;

const emptyForm: PlayerForm = {
  name: '', position: '', appearances: 0, goals: 0, assists: 0, goal_per_match: 0,
  assists_per_match: 0, confidence: 0, goal_contribution_pm: 0, goal_contribution: 0, season: '2025-2026', image_url: '',
};

const numberFields: (keyof PlayerForm)[] = ['appearances', 'goals', 'assists', 'goal_per_match', 'assists_per_match', 'confidence', 'goal_contribution_pm', 'goal_contribution'];
const columns: { key: keyof PlayerForm; label: string; decimals?: boolean }[] = [
  { key: 'name', label: 'Player' }, { key: 'position', label: 'Position' }, { key: 'appearances', label: 'Matches' },
  { key: 'goals', label: 'Goals' }, { key: 'assists', label: 'Assists' }, { key: 'goal_per_match', label: 'Goals / Match', decimals: true },
  { key: 'assists_per_match', label: 'Assists / Match', decimals: true }, { key: 'confidence', label: 'Confidence', decimals: true },
  { key: 'goal_contribution_pm', label: 'Contribution / Match', decimals: true }, { key: 'goal_contribution', label: 'Contribution' },
];

// image_url is editable in the form but not shown as a table column
const formOnlyFields: { key: keyof PlayerForm; label: string }[] = [{ key: 'image_url', label: 'Profile image URL' }];

function valueFromRow(row: Record<string, unknown>, ...keys: string[]): unknown {
  return keys.map((key) => row[key]).find((value) => value !== undefined && value !== null && value !== '');
}

function toNumber(value: unknown): number { return Number(value) || 0; }

function rowToPlayer(row: Record<string, unknown>): PlayerForm {
  return {
    ...emptyForm,
    name: String(valueFromRow(row, 'Player Name', 'name', 'Name', 'Player') || ''),
    position: String(valueFromRow(row, 'Position', 'position') || ''),
    appearances: toNumber(valueFromRow(row, 'Match Count', 'appearances', 'Appearances')),
    goals: toNumber(valueFromRow(row, 'Goals', 'goals')),
    assists: toNumber(valueFromRow(row, 'Asisists', 'Assists', 'assists')),
    goal_per_match: toNumber(valueFromRow(row, 'Goal Per Match', 'goal_per_match')),
    assists_per_match: toNumber(valueFromRow(row, 'Assists Per Match', 'assists_per_match')),
    confidence: toNumber(valueFromRow(row, 'Confidence', 'confidence')),
    goal_contribution_pm: toNumber(valueFromRow(row, 'Goal Contribution PM', 'goal_contribution_pm')),
    goal_contribution: toNumber(valueFromRow(row, 'Goal Contribution', 'goal_contribution')),
    season: String(valueFromRow(row, 'Season', 'season') || '2025-2026'),
  };
}

function PlayerStatsPage({ onPlayerClick }: { onPlayerClick?: (playerId: string) => void }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('All positions');
  const [editing, setEditing] = useState<Player | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PlayerForm>(emptyForm);
  const [message, setMessage] = useState('');
  const [sortKey, setSortKey] = useState<keyof PlayerForm>('goals');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSort = (key: keyof PlayerForm) => {
    if (sortKey === key) { setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc')); } else { setSortKey(key); setSortDir(key === 'name' || key === 'position' ? 'asc' : 'desc'); }
  };

  const loadPlayers = async () => {
    const { data, error } = await supabase.from('players').select('*').order('goals', { ascending: false });
    if (error) setMessage(error.message);
    if (data) setPlayers(data as Player[]);
  };

  useEffect(() => { void loadPlayers(); }, []);

  const filtered = useMemo(() => {
    const list = players.filter((player) => `${player.name} ${player.position || ''}`.toLowerCase().includes(search.toLowerCase()) && (position === 'All positions' || player.position === position));
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
  }, [players, position, search, sortKey, sortDir]);
  const positions = ['All positions', ...Array.from(new Set(players.map((player) => player.position).filter(Boolean) as string[]))];

  const openEdit = (player: Player) => { setEditing(player); setForm({ ...player }); setShowForm(true); };
  const openNew = () => { setEditing(null); setForm({ ...emptyForm }); setShowForm(true); };
  const savePlayer = async () => {
    if (!form.name.trim()) return;
    const result = editing ? await supabase.from('players').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id) : await supabase.from('players').insert(form);
    if (result.error) setMessage(result.error.message); else { setMessage(editing ? 'Player updated' : 'Player added'); setShowForm(false); await loadPlayers(); setTimeout(() => setMessage(''), 2500); }
  };
  const deletePlayer = async () => { if (!editing) return; const result = await supabase.from('players').delete().eq('id', editing.id); if (result.error) setMessage(result.error.message); else { setShowForm(false); await loadPlayers(); } };

  const importRows = async (rows: Record<string, unknown>[]) => {
    const payload = rows.map(rowToPlayer).filter((row) => row.name.trim());
    if (!payload.length) { setMessage('No valid players found in the Excel file'); return; }
    const result = await supabase.from('players').insert(payload);
    setMessage(result.error ? result.error.message : `${payload.length} players imported`);
    if (!result.error) await loadPlayers();
    setTimeout(() => setMessage(''), 3000);
  };

  const importExcel = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) { const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' }); await importRows(XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]])); }
    event.target.value = '';
  };

  const importFromArchive = async () => {
    setMessage('Importing player archive...');
    try {
      const response = await fetch('/exports/player_stats.xlsx');
      if (!response.ok) { setMessage('player_stats.xlsx was not found in the archive folder'); return; }
      const workbook = XLSX.read(await response.arrayBuffer(), { type: 'array' });
      await importRows(XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]]));
    } catch { setMessage('Could not read the player archive'); }
  };

  const exportExcel = () => {
    const rows = filtered.map((player) => ({ 'Player Name': player.name, Position: player.position, 'Match Count': player.appearances, Goals: player.goals, Asisists: player.assists, 'Goal Per Match': player.goal_per_match, 'Assists Per Match': player.assists_per_match, Confidence: player.confidence, 'Goal Contribution PM': player.goal_contribution_pm, 'Goal Contribution': player.goal_contribution, Season: player.season }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Player Stats');
    XLSX.writeFile(workbook, `player_stats-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const setField = (key: keyof PlayerForm, value: string) => setForm((current) => ({ ...current, [key]: numberFields.includes(key) ? toNumber(value) : value }));

  return <div className="space-y-6 animate-fade-in">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div><p className="text-sm text-emerald-400 font-medium mb-2">PERFORMANCE ARCHIVE</p><h2 className="text-3xl font-bold tracking-tight">Player Stats</h2><p className="text-slate-500 mt-2">Player performance imported from your archive.</p></div><div className="flex flex-wrap gap-2"><input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800"><Upload className="w-4 h-4" /> Import Excel</button><button onClick={importFromArchive} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800"><FileSpreadsheet className="w-4 h-4" /> Import Archive</button><button onClick={exportExcel} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800"><Download className="w-4 h-4" /> Export Excel</button><button onClick={openNew} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400"><Plus className="w-4 h-4" /> Add player</button></div></div>
    {message && <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 text-sm flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" />{message}</div>}
    <div className="flex flex-col sm:flex-row gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search players or positions..." className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500/50" /></div><select value={position} onChange={(event) => setPosition(event.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-300 outline-none">{positions.map((item) => <option key={item}>{item}</option>)}</select></div>
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm min-w-[1100px]"><thead><tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">{columns.map((column) => { const active = sortKey === column.key; return <th key={column.key} className={column.key === 'name' || column.key === 'position' ? 'text-left px-5 py-4' : 'text-right px-4 py-4'}><button onClick={() => toggleSort(column.key)} className={`inline-flex items-center gap-1 hover:text-slate-300 transition-colors ${active ? 'text-slate-200' : ''}`}>{column.label}{active && (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}</button></th>; })}<th className="px-5 py-4" /></tr></thead><tbody>{filtered.map((player) => <tr key={player.id} onClick={() => onPlayerClick?.(player.id)} className={`border-b border-slate-800/70 last:border-0 hover:bg-slate-800/30 ${onPlayerClick ? 'cursor-pointer' : ''}`}><td className="px-5 py-3.5 font-medium text-slate-200">{player.name}</td><td className="px-5 py-3.5 text-slate-400">{player.position || '—'}</td>{columns.slice(2).map((column) => <td key={column.key} className="px-4 py-3.5 text-right text-slate-300">{column.decimals ? Number(player[column.key] || 0).toFixed(3) : player[column.key]}</td>)}<td className="px-5 py-3.5 text-right"><button onClick={(e) => { e.stopPropagation(); openEdit(player); }} className="text-xs text-slate-500 hover:text-white">Edit</button></td></tr>)}</tbody></table></div>{!filtered.length && <div className="py-16 text-center"><Users className="w-8 h-8 text-slate-700 mx-auto mb-3" /><p className="text-slate-500 text-sm">No players found</p></div>}<div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-600">Showing {filtered.length} of {players.length} players</div></div>
    {showForm && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"><div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"><div className="flex items-center justify-between p-5 border-b border-slate-800"><div><h3 className="font-semibold">{editing ? 'Edit player' : 'Add player'}</h3><p className="text-xs text-slate-500 mt-1">Update archive metrics</p></div><button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button></div><div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">{columns.map((column) => <label key={column.key} className={column.key === 'name' ? 'col-span-2 sm:col-span-3 text-xs text-slate-400' : 'text-xs text-slate-400'}>{column.label}<input type={column.key === 'name' || column.key === 'position' ? 'text' : 'number'} step={column.decimals ? '0.000001' : undefined} value={form[column.key] ?? ''} onChange={(event) => setField(column.key, event.target.value)} className="mt-1.5 w-full bg-white border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-900" /></label>)}{formOnlyFields.map((field) => <label key={field.key} className="col-span-2 sm:col-span-3 text-xs text-slate-400">{field.label}<input type="text" value={form[field.key] ?? ''} onChange={(event) => setField(field.key, event.target.value)} className="mt-1.5 w-full bg-white border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-900" /></label>)}</div><div className="flex items-center justify-between p-5 border-t border-slate-800"><div>{editing && <button onClick={deletePlayer} className="flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300"><Trash2 className="w-4 h-4" /> Delete</button>}</div><div className="flex gap-2"><button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white">Cancel</button><button onClick={savePlayer} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 text-sm font-semibold hover:bg-emerald-400"><Save className="w-4 h-4" /> Save player</button></div></div></div></div>}
  </div>;
}

export default PlayerStatsPage;
