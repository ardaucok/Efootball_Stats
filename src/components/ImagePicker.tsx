import { useMemo, useState } from 'react';
import { X, Check, Search } from 'lucide-react';

export type ImageCategory = 'players' | 'teams' | 'trophies';

const CATEGORY_LABELS: Record<ImageCategory, string> = {
  players: 'Player Images',
  teams: 'Team Logos',
  trophies: 'Trophy Images',
};

const PLAYER_IMAGES = import.meta.glob('/public/images/players/*', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const TEAM_IMAGES = import.meta.glob('/public/images/teams/*', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const TROPHY_IMAGES = import.meta.glob('/public/images/trophies/*', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const ALL_IMAGES: Record<ImageCategory, string[]> = {
  players: Object.values(PLAYER_IMAGES).map((url) => url.replace('/public', '')),
  teams: Object.values(TEAM_IMAGES).map((url) => url.replace('/public', '')),
  trophies: Object.values(TROPHY_IMAGES).map((url) => url.replace('/public', '')),
};

function fileNameFromPath(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

type ImagePickerProps = {
  category: ImageCategory;
  onSelect: (url: string) => void;
  onClose: () => void;
  currentUrl?: string | null;
};

function ImagePicker({ category, onSelect, onClose, currentUrl }: ImagePickerProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(currentUrl || null);

  const images = useMemo(() => {
    const list = ALL_IMAGES[category];
    if (!search.trim()) return list;
    return list.filter((url) => fileNameFromPath(url).toLowerCase().includes(search.toLowerCase()));
  }, [category, search]);

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-[#14213d]">Select from {CATEGORY_LABELS[category]}</h3>
            <p className="text-xs text-slate-500 mt-1">Choose an image from the project's local collection</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by file name..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#2f7d5a]/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {images.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {images.map((url) => {
                const isSelected = selected === url;
                return (
                  <button
                    key={url}
                    onClick={() => setSelected(url)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected ? 'border-[#2f7d5a] ring-2 ring-[#2f7d5a]/30' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img src={url} alt={fileNameFromPath(url)} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#2f7d5a]/20 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-[#2f7d5a] flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-400">No images found{search ? ' matching your search' : ''}.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2f7d5a] text-white text-sm font-semibold hover:bg-[#256548] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" /> Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImagePicker;
