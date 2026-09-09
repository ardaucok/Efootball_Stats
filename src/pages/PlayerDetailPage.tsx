import { useEffect, useState, type ChangeEvent } from 'react';
import { ArrowLeft, Award, ImagePlus, Save, Trash2, X, Goal, Users, TrendingUp, Shield } from 'lucide-react';
import { supabase, type Player, type PlayerImage, type Award as AwardType } from '@/lib/supabase';
import { uploadImage } from '@/lib/storage';

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
  const [images, setImages] = useState<PlayerImage[]>([]);
  const [awards, setAwards] = useState<AwardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAwardForm, setShowAwardForm] = useState(false);
  const [awardForm, setAwardForm] = useState({ award_type: '', season: '', team: '', image_url: '', description: '' });
  const [captionInput, setCaptionInput] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [playerRes, imagesRes, awardsRes] = await Promise.all([
        supabase.from('players').select('*').eq('id', playerId).maybeSingle(),
        supabase.from('player_images').select('*').eq('player_id', playerId).order('created_at', { ascending: false }),
        supabase.from('awards').select('*').eq('player_name', player?.name || '').order('created_at', { ascending: false }),
      ]);
      if (playerRes.data) setPlayer(playerRes.data as Player);
      if (imagesRes.data) setImages(imagesRes.data as PlayerImage[]);
      if (awardsRes.data) setAwards(awardsRes.data as AwardType[]);
      setLoading(false);
    };
    void load();
  }, [playerId]);

  // Reload awards once player name is known
  useEffect(() => {
    if (!player?.name) return;
    const loadAwards = async () => {
      const { data } = await supabase.from('awards').select('*').eq('player_name', player.name).order('created_at', { ascending: false });
      if (data) setAwards(data as AwardType[]);
    };
    void loadAwards();
  }, [player?.name]);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !player) return;
    setUploading(true);
    const url = await uploadImage('player-images', file, `player-${playerId}-`);
    if (url) {
      const { data } = await supabase.from('player_images').insert({ player_id: playerId, image_url: url, caption: captionInput.trim() || null }).select('*').single();
      if (data) setImages((prev) => [data as PlayerImage, ...prev]);
      setCaptionInput('');
    }
    setUploading(false);
    event.target.value = '';
  };

  const deleteImage = async (imageId: string) => {
    const { error } = await supabase.from('player_images').delete().eq('id', imageId);
    if (!error) setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const saveAward = async () => {
    if (!player || !awardForm.award_type.trim()) return;
    const { data } = await supabase.from('awards').insert({ player_name: player.name, ...awardForm }).select('*').single();
    if (data) { setAwards((prev) => [data as AwardType, ...prev]); setShowAwardForm(false); setAwardForm({ award_type: '', season: '', team: '', image_url: '', description: '' }); }
  };

  const handleAwardImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = await uploadImage('player-images', file, 'award-');
    if (url) setAwardForm((prev) => ({ ...prev, image_url: url }));
    event.target.value = '';
  };

  const deleteAward = async (awardId: string) => {
    const { error } = await supabase.from('awards').delete().eq('id', awardId);
    if (!error) setAwards((prev) => prev.filter((a) => a.id !== awardId));
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!player) return <div className="py-20 text-center"><p className="text-slate-500">Player not found</p><button onClick={onBack} className="mt-4 text-emerald-500 text-sm">Go back</button></div>;

  return <div className="space-y-6 animate-fade-in">
    <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"><ArrowLeft className="w-4 h-4" /> Back to players</button>

    {/* Header */}
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#14213d] via-[#1c2f52] to-[#2f7d5a] border border-[#243653] p-6 lg:p-8">
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl overflow-hidden bg-[#243653] flex items-center justify-center shrink-0">
          {player.image_url ? <img src={player.image_url} alt={player.name} className="w-full h-full object-cover" /> : <Users className="w-12 h-12 text-slate-600" />}
        </div>
        <div>
          <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1">{player.position || 'Player'}</p>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white">{player.name}</h2>
          <p className="text-sm text-[#b7c4d6] mt-2">Season {player.season || '2025-2026'}</p>
        </div>
      </div>
      <div className="absolute -right-16 -bottom-20 w-72 h-72 rounded-full border border-[#d9a441]/10" />
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

    {/* Image Gallery */}
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div><h3 className="font-semibold text-[#14213d]">Image Gallery</h3><p className="text-xs text-slate-500 mt-1">Add photos of the player</p></div>
        <div className="flex items-center gap-2">
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="player-image-upload" disabled={uploading} />
          <input value={captionInput} onChange={(e) => setCaptionInput(e.target.value)} placeholder="Caption (optional)" className="text-xs bg-[#f1f5f9] border border-[#e2e8f0] rounded-lg px-3 py-2 w-32 sm:w-40 outline-none focus:border-[#2f7d5a]/50" />
          <label htmlFor="player-image-upload" className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg bg-[#2f7d5a] text-white text-sm font-semibold hover:bg-[#1f5a40] transition-colors">
            <ImagePlus className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Add image'}
          </label>
        </div>
      </div>
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden bg-[#f1f5f9]">
              <img src={img.image_url} alt={img.caption || 'Player photo'} className="w-full h-full object-cover" />
              {img.caption && <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-3 py-1.5 text-xs text-white truncate">{img.caption}</div>}
              <button onClick={() => deleteImage(img.id)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center border-2 border-dashed border-[#e2e8f0] rounded-xl">
          <ImagePlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No images yet. Upload the first photo.</p>
        </div>
      )}
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
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5">
                  <span>{award.season || 'Season not set'}</span>
                  {award.team && <><span>·</span><span>{award.team}</span></>}
                </div>
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

    {/* Award form modal */}
    {showAwardForm && (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 className="font-semibold text-[#14213d]">Add award for {player.name}</h3>
            <button onClick={() => setShowAwardForm(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-4">
            <input type="file" accept="image/*" onChange={handleAwardImageUpload} className="hidden" id="award-image-upload-detail" />
            <label htmlFor="award-image-upload-detail" className="flex items-center gap-2 cursor-pointer text-xs text-rose-500 hover:text-rose-400"><ImagePlus className="w-4 h-4" /> Upload award image</label>
            {([
              ['award_type', 'Award type', 'text'],
              ['season', 'Season', 'text'],
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
  </div>;
}

export default PlayerDetailPage;
