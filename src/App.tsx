import { useState } from 'react';
import { LayoutDashboard, Users, Trophy, Award, BarChart3, Menu, X } from 'lucide-react';
import HomePage from '@/pages/HomePage';
import PlayerStatsPage from '@/pages/PlayerStatsPage';
import LeagueStatsPage from '@/pages/LeagueStatsPage';
import TrophyRoomPage from '@/pages/TrophyRoomPage';
import AwardedPlayersPage from '@/pages/AwardedPlayersPage';

type PageId = 'home' | 'players' | 'league' | 'trophies' | 'awards';

const NAV_ITEMS: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'home', label: 'Home', icon: LayoutDashboard },
  { id: 'players', label: 'Player Stats', icon: Users },
  { id: 'league', label: 'League Stats', icon: BarChart3 },
  { id: 'trophies', label: 'Trophy Room', icon: Trophy },
  { id: 'awards', label: 'Awarded Players', icon: Award },
];

function App() {
  const [activePage, setActivePage] = useState<PageId>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (page: PageId) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'players':
        return <PlayerStatsPage />;
      case 'league':
        return <LeagueStatsPage />;
      case 'trophies':
        return <TrophyRoomPage />;
      case 'awards':
        return <AwardedPlayersPage />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f6] text-[#14213d] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#14213d] border-r border-slate-800 z-40 transition-transform duration-300 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#243653]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2f7d5a] to-[#d9a441] flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">Stat Tracker</h1>
              <p className="text-xs text-[#9fb0c7]">Football Archive</p>
            </div>
          </div>
          <button
            className="lg:hidden text-[#9fb0c7] hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#2f7d5a]/20 text-[#8ed1af] border border-[#2f7d5a]/40'
                    : 'text-[#b7c4d6] hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t border-[#243653]">
          <p className="text-xs text-[#7f91aa]">Season 2025-2026</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-[#14213d] border-b border-[#243653] px-4 py-3 flex items-center gap-3">
          <button
            className="text-[#b7c4d6] hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2f7d5a] to-[#d9a441] flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-white">Stat Tracker</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">{renderPage()}</main>
      </div>
    </div>
  );
}

export default App;
