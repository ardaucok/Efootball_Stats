import { useEffect, useState } from 'react';
import { ArrowRight, Award, BarChart3, Goal, Trophy, Users, Upload, TrendingUp } from 'lucide-react';
import { supabase, type Player, type Trophy as TrophyType, type Award as AwardType } from '@/lib/supabase';

type PageId = 'home' | 'players' | 'league' | 'trophies' | 'awards';

type HomePageProps = {
  onNavigate: (page: PageId) => void;
};

const quickActions = [
  { id: 'players' as PageId, label: 'Player Stats', description: 'View and edit player performance', icon: Users, color: 'emerald' },
  { id: 'league' as PageId, label: 'League Stats', description: 'Explore team standings', icon: BarChart3, color: 'blue' },
  { id: 'trophies' as PageId, label: 'Trophy Room', description: 'Browse competition history', icon: Trophy, color: 'amber' },
  { id: 'awards' as PageId, label: 'Awarded Players', description: 'See individual honors', icon: Award, color: 'rose' },
];

function HomePage({ onNavigate }: HomePageProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [trophies, setTrophies] = useState<TrophyType[]>([]);
  const [awards, setAwards] = useState<AwardType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [playersResult, trophiesResult, awardsResult] = await Promise.all([
        supabase.from('players').select('*'),
        supabase.from('trophies').select('*'),
        supabase.from('awards').select('*'),
      ]);
      if (playersResult.data) setPlayers(playersResult.data);
      if (trophiesResult.data) setTrophies(trophiesResult.data);
      if (awardsResult.data) setAwards(awardsResult.data);
      setLoading(false);
    };
    void load();
  }, []);

  const totalGoals = players.reduce((sum, player) => sum + player.goals, 0);
  const topScorer = [...players].sort((a, b) => b.goals - a.goals)[0];
  const avgConfidence = players.length ? players.reduce((sum, player) => sum + Number(player.confidence), 0) / players.length : 0;

  const cards = [
    { label: 'Total Players', value: players.length, icon: Users, accent: 'text-[#2f7d5a]', bg: 'bg-[#2f7d5a]/10' },
    { label: 'Goals Scored', value: totalGoals, icon: Goal, accent: 'text-[#d9a441]', bg: 'bg-[#d9a441]/10' },
    { label: 'Trophies Won', value: trophies.length, icon: Trophy, accent: 'text-[#e76f51]', bg: 'bg-[#e76f51]/10' },
    { label: 'Average Confidence', value: avgConfidence.toFixed(2), icon: TrendingUp, accent: 'text-[#264653]', bg: 'bg-[#264653]/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#14213d] via-[#1c2f52] to-[#2f7d5a] border border-[#243653] p-6 lg:p-10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#d9a441]/15 text-[#e8c275] text-xs font-semibold mb-5 border border-[#d9a441]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d9a441] animate-pulse" />
            YOUR FOOTBALL ARCHIVE
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold tracking-tight leading-tight mb-4 text-white">Every match.<br /><span className="text-[#8ed1af]">Every story.</span></h2>
          <p className="text-[#b7c4d6] max-w-lg leading-relaxed">Track player performance, league history and unforgettable moments in one place. Your football data, beautifully organized.</p>
        </div>
        <div className="absolute -right-24 -bottom-32 w-96 h-96 rounded-full border border-[#d9a441]/15" />
        <div className="absolute -right-8 -bottom-16 w-64 h-64 rounded-full border border-[#d9a441]/15" />
        <div className="absolute right-12 top-10 opacity-[0.10]"><Goal className="w-48 h-48 text-[#d9a441]" /></div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-[#e2e8f0] rounded-xl p-4 lg:p-5 hover:border-[#2f7d5a]/50 hover:shadow-lg hover:shadow-[#2f7d5a]/5 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}><Icon className={`w-4.5 h-4.5 ${card.accent}`} style={{ width: 18, height: 18 }} /></div>
              </div>
              <p className="text-2xl lg:text-3xl font-bold tracking-tight">{loading ? '—' : card.value}</p>
              <p className="text-xs text-slate-500 mt-1">{card.label}</p>
            </div>
          );
        })}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4"><div><h3 className="text-lg font-semibold text-[#14213d]">Explore your archive</h3><p className="text-sm text-[#6b7c93] mt-1">Jump into any section</p></div><button onClick={() => onNavigate('players')} className="hidden sm:flex items-center gap-1 text-xs text-[#2f7d5a] hover:text-[#1f5a40] font-semibold">View players <ArrowRight className="w-3.5 h-3.5" /></button></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => { const Icon = action.icon; return <button key={action.id} onClick={() => onNavigate(action.id)} className="group text-left bg-white border border-[#e2e8f0] rounded-xl p-4 hover:border-[#2f7d5a]/50 hover:shadow-lg hover:shadow-[#2f7d5a]/5 transition-all"><div className="flex items-center justify-between mb-4"><div className={`w-10 h-10 rounded-xl bg-${action.color}-500/10 flex items-center justify-center`}><Icon className={`w-5 h-5 text-${action.color}-400`} /></div><ArrowRight className="w-4 h-4 text-[#cbd5e1] group-hover:text-[#2f7d5a] group-hover:translate-x-1 transition-all" /></div><p className="font-medium text-sm">{action.label}</p><p className="text-xs text-slate-500 mt-1">{action.description}</p></button>; })}
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5"><div className="flex items-center justify-between mb-5"><div><h3 className="font-semibold text-[#14213d]">Top scorer</h3><p className="text-xs text-[#6b7c93] mt-1">Most goals in your archive</p></div><Goal className="w-5 h-5 text-[#d9a441]" /></div>{topScorer ? <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-xl bg-[#f1f5f9] flex items-center justify-center"><Users className="w-6 h-6 text-[#cbd5e1]" /></div><div className="flex-1"><p className="font-semibold text-[#14213d]">{topScorer.name}</p><p className="text-xs text-[#6b7c93] mt-1">{topScorer.position || 'Player'}</p></div><div className="text-right"><p className="text-2xl font-bold text-[#d9a441]">{topScorer.goals}</p><p className="text-xs text-[#6b7c93]">goals</p></div></div> : <div className="flex items-center gap-3 text-[#6b7c93] text-sm"><Upload className="w-4 h-4" /> Import player data to see leaders</div>}</div>
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5"><div className="flex items-center justify-between mb-5"><div><h3 className="font-semibold text-[#14213d]">Recent highlights</h3><p className="text-xs text-[#6b7c93] mt-1">Latest archive additions</p></div><Award className="w-5 h-5 text-[#e76f51]" /></div>{awards.length || trophies.length ? <div className="space-y-3">{[...awards.slice(0, 2).map((a) => ({ ...a, label: a.award_type || 'Award', sub: a.player_name, icon: Award, color: 'text-[#e76f51]' })), ...trophies.slice(0, 1).map((t) => ({ ...t, label: t.name, sub: t.team || 'Trophy', icon: Trophy, color: 'text-[#d9a441]' }))].slice(0, 3).map((item, index) => { const Icon = item.icon; return <div key={`${item.label}-${index}`} className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-[#f1f5f9] flex items-center justify-center"><Icon className={`w-4 h-4 ${item.color}`} /></div><div><p className="text-sm font-medium text-[#14213d]">{item.label}</p><p className="text-xs text-[#6b7c93]">{item.sub}</p></div></div>; })}</div> : <p className="text-sm text-[#6b7c93]">Your latest trophies and awards will appear here.</p>}</div>
      </section>
    </div>
  );
}

export default HomePage;
