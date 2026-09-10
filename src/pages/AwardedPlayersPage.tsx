import { useEffect, useState } from 'react';
import { Award, Plus, X, Save, Trash2, ImagePlus, Search } from 'lucide-react';
import { supabase, type Award as AwardType, type AwardedPlayer, type Player } from '@/lib/supabase';
import ImagePicker from '@/components/ImagePicker';

type AwardedPlayerWithAwards = AwardedPlayer & {
  awards: AwardType[];
  player?: Player;
};

function AwardedPlayersPage() {
  const [featured, setFeatured] = useState<AwardedPlayerWithAwards[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);

  const load = async () => {
    const { data: featuredData } = await supabase.from('awarded_players').select('*').order('created_at', { ascending: false });
    if (!featuredData || featuredData.length === 0) {
      setFeatured([]);
      return;
    }

    const playerIds = featuredData.map((f) => f.player_id);
    const [{ data: playersData }, { data: awardsData }] = await Promise.all([
      supabase.from('players').select('*').in('id', playerIds),
      supabase.from('awards').select('*').in('player_name', featuredData.map((f) => f.player_name)).order('created_at', { ascending: false }),
    ]);

    const playerMap = new Map((playersData || []).map((p) => [p.id, p as Player]));
    const awardsByPlayer = new Map<string, AwardType[]>();
    (awardsData || []).forEach((a) => {
      const list = awardsByPlayer.get(a.player_name) || [];
      list.push(a as AwardType);
      awardsByPlayer.set(a.player_name, list);
    });

    setFeatured(featuredData.map((f) => ({
      ...f,
      awards: awardsByPlayer.get(f.player_name) || [],
      player: playerMap.get(f.player_id),
    })));
  };

  useEffect(() => { void load(); }, []);

  const searchPlayers = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); return; }
    const { data } = await supabase.from('players').select('*').ilike('name', `%${query}%`).limit(10);
    setSearchResults((data || []) as Player[]);
  };

  const addPlayer = async () => {
    if (!selectedPlayer) return;
    const { data: existing } = await supabase.from('awarded_players').select('id').eq('player_id', selectedPlayer.id).maybeSingle();
    if (existing) {
      setShowAddForm(false);
      setSelectedPlayer(null);
      setCardImageUrl(null);
      setSearchQuery('');
      setSearchResults([]);
      return;
    }
    await supabase.from('awarded_players').insert({
      player_id: selectedPlayer.id,
      player_name: selectedPlayer.name,
      card_image_url: cardImageUrl,
    });
    setShowAddForm(false);
    setSelectedPlayer(null);
    setCardImageUrl(null);
    setSearchQuery('');
    setSearchResults([]);
    await load();
  };

  const removePlayer = async (id: string) => {
    await supabase.from('awarded_players').delete().eq('id', id);
    await load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-rose-400 font-medium mb-2">INDIVIDUAL HONOURS</p>
          <h2 className="text-3xl font-bold tracking-tight">Awarded Players</h2>
          <p className="text-slate-500 mt-2">Celebrate the players who made the difference.</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 self-start px-3 py-2 rounded-lg bg-rose-500 text-white text-sm font-semibold hover:bg-rose-400"
        >
          <Plus className="w-4 h-4" /> Add player
        </button>
      </div>

      {featured.length > 0 ? (
        <div className="space-y-4">
          {featured.map((fp) => (
            <div key={fp.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              {/* Player header */}
              <div className="flex items-center gap-4 p-5 border-b border-slate-800">
                {fp.card_image_url ? (
                  <img src={fp.card_image_url} alt={fp.player_name} className="w-16 h-20 object-cover rounded-lg" />
                ) : fp.player?.image_url ? (
                  <img src={fp.player.image_url} alt={fp.player_name} className="w-16 h-20 object-cover rounded-lg" />
                ) : (
                  <div className="w-16 h-20 rounded-lg bg-slate-800 flex items-center justify-center">
                    <Award className="w-6 h-6 text-slate-600" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-200 text-lg">{fp.player_name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {fp.player?.position || 'Player'} · {fp.awards.length} award{fp.awards.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => removePlayer(fp.id)}
                  className="text-slate-600 hover:text-rose-400"
                  title="Remove from list"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Awards list */}
              {fp.awards.length > 0 ? (
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {fp.awards.map((award) => (
                    <div key={award.id} className="group bg-slate-800/50 border border-slate-800 rounded-lg overflow-hidden hover:border-rose-500/30 transition-colors">
                      <div className="aspect-[16/10] bg-gradient-to-br from-rose-950/40 to-slate-800 flex items-center justify-center overflow-hidden">
                        {award.image_url ? (
                          <img src={award.image_url} alt={award.award_type || 'Award'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <Award className="w-10 h-10 text-rose-500/40" />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-rose-400 font-medium uppercase tracking-wide">{award.award_type || 'Award'}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                          {award.season && <span>{award.season}</span>}
                          {award.team && <><span>·</span><span>{award.team}</span></>}
                        </div>
                        {award.description && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{award.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Award className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No awards added for this player yet</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-slate-900 border border-slate-800 border-dashed rounded-xl">
          <Award className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">No awarded players yet</p>
          <p className="text-xs text-slate-600 mt-1">Add a player to showcase their awards</p>
        </div>
      )}

      {/* Add player form modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between p-5 border-b border-slate-800">
              <h3 className="font-semibold">Add awarded player</h3>
              <button onClick={() => { setShowAddForm(false); setSelectedPlayer(null); setSearchQuery(''); setSearchResults([]); setCardImageUrl(null); }}>
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Player search */}
              {!selectedPlayer ? (
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Search for a player</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      value={searchQuery}
                      onChange={(e) => searchPlayers(e.target.value)}
                      placeholder="Type player name..."
                      className="w-full bg-white border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900"
                      autoFocus
                    />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                      {searchResults.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedPlayer(p); setSearchQuery(''); setSearchResults([]); }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 text-left"
                        >
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                              <Award className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                          )}
                          <span className="text-sm text-slate-200">{p.name}</span>
                          {p.position && <span className="text-xs text-slate-500">{p.position}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    {selectedPlayer.image_url ? (
                      <img src={selectedPlayer.image_url} alt={selectedPlayer.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <Award className="w-4 h-4 text-slate-500" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-slate-200">{selectedPlayer.name}</span>
                    <button
                      onClick={() => setSelectedPlayer(null)}
                      className="ml-auto text-slate-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Card image */}
                  <div className="mt-4">
                    <span className="text-xs text-slate-400">Card image (optional)</span>
                    <div className="mt-1.5 flex items-center gap-3">
                      {cardImageUrl ? (
                        <div className="relative">
                          <img src={cardImageUrl} alt="card" className="w-16 h-20 object-cover rounded-lg" />
                          <button
                            onClick={() => setCardImageUrl(null)}
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-20 rounded-lg border border-dashed border-slate-700 flex items-center justify-center">
                          <ImagePlus className="w-5 h-5 text-slate-600" />
                        </div>
                      )}
                      <button
                        onClick={() => setShowImagePicker(true)}
                        className="px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800"
                      >
                        Select Image
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 p-5 border-t border-slate-800">
              <button onClick={() => { setShowAddForm(false); setSelectedPlayer(null); setSearchQuery(''); setSearchResults([]); setCardImageUrl(null); }} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
              <button
                onClick={addPlayer}
                disabled={!selectedPlayer}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" /> Add player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image picker for card image */}
      {showImagePicker && (
        <ImagePicker
          category="players"
          currentUrl={cardImageUrl}
          onSelect={(url) => setCardImageUrl(url)}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
}

export default AwardedPlayersPage;
